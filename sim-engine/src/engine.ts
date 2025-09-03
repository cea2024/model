import { Params, Results, MonthlyRow, Cohort } from './types';
import { validateParams } from './params';
import { scheduleRepay, joinMonth, dueMonth, isCohortActive, getYear } from './scheduler';
import { calculateTotalOpex } from './opex';
import { calculateMonthlyRate, calculateYield, calculateEarlyRepayment } from './utils';
import { buildYearlyData, calculateKpis } from './analytics';

/**
 * מריץ סימולציה מלאה של מודל הגמ"ח
 * @param params פרמטרי הסימולציה
 * @returns תוצאות הסימולציה
 */
export function simulate(params: Params): Results {
  // וולידציה של פרמטרים
  const validationErrors = validateParams(params);
  if (validationErrors.length > 0) {
    throw new Error(`שגיאות בפרמטרים: ${validationErrors.join(', ')}`);
  }

  const totalMonths = params.intake.years * 12;
  const monthlyRate = calculateMonthlyRate(params.yield.annualRate);
  
  // יצירת מערכים לתוצאות
  const monthlyData: MonthlyRow[] = [];
  const repayStdSchedule = new Float64Array(totalMonths);
  const repayEarlySchedule = new Float64Array(totalMonths);
  
  // מעקב אחר קוהורטים - יווצרו דינמית במהלך הסימולציה
  const cohorts: Cohort[] = [];

  let cash = 0;
  let totalEarlyIssued = 0; // מעקב אחר סך הלוואות מוקדמות

  // חישוב מגבלת מוקדמות
  const totalUnits = params.intake.newPerMonth * totalMonths;
  const maxEarlyAllowed = params.early.maxPercent ? 
    Math.floor((params.early.maxPercent / 100) * totalUnits) : 
    Number.MAX_SAFE_INTEGER;

  // לולאה ראשית - חודש אחר חודש
  for (let t = 0; t < totalMonths; t++) {
    const year = getYear(t);
    let contribIn = 0;
    let opexOut = 0;
    let loansStdOut = 0;
    let loansEarlyOut = 0;
    let issuedStd = 0;
    let issuedEarly = 0;
    let note = '';

    // 0. יצירת קוהורט חדש בחודש זה
    cohorts.push({
      joinMonth: t,
      dueMonth: dueMonth(t, params.std.waitMonths),
      size: params.intake.newPerMonth,
      remaining: params.intake.newPerMonth,
      receivedEarly: 0,
      isActive: true
    });

    // 1. חישוב תרומות מקוהורטים פעילים
    for (const cohort of cohorts) {
      if (isCohortActive(t, cohort.joinMonth, params.savings.months)) {
        contribIn += cohort.size * params.savings.monthly;
      }
    }

    // 2. חישוב החזרים מתוזמנים
    const repayStdIn = repayStdSchedule[t];
    const repayEarlyIn = repayEarlySchedule[t];

    // 3. חישוב תשואה
    const yieldIn = calculateYield(cash, monthlyRate, params.yield.applyOnMinCash);

    // עדכון יתרה עם כניסות
    cash += contribIn + repayStdIn + repayEarlyIn + yieldIn;

    // 4. OPEX - הצטרפות חדשה (UPFRONT) - כל חודש יש קוהורט חדש
    if (t < totalMonths) { // יש קוהורט חדש בחודש זה
      opexOut += calculateTotalOpex(params.opex, 'upfront', params.intake.newPerMonth);
    }

    // 5. OPEX - חודשי (MONTHLY)
    let activeUnits = 0;
    for (const cohort of cohorts) {
      if (isCohortActive(t, cohort.joinMonth, params.savings.months)) {
        activeUnits += cohort.size;
      }
    }
    opexOut += calculateTotalOpex(params.opex, 'monthly', activeUnits, params.savings.months);

    // 6. הנפקת הלוואות רגילות (בחודש due)
    for (const cohort of cohorts) {
      if (cohort.dueMonth === t && cohort.remaining > 0) {
        const loansToIssue = cohort.remaining;
        const totalLoanAmount = loansToIssue * params.std.amount;
        
        loansStdOut += totalLoanAmount;
        issuedStd += loansToIssue;
        
        // OPEX על הלוואות
        opexOut += calculateTotalOpex(params.opex, 'onloan', loansToIssue);
        
        // תזמון החזרים (ללא מחילת זנב)
        const effectiveRepayMonths = params.std.repayMonths - params.std.forgivenMonths;
        scheduleRepay(
          repayStdSchedule,
          t + 1, // החזר מתחיל מהחודש הבא
          effectiveRepayMonths,
          params.std.repayMonthly,
          loansToIssue
        );
        
        cohort.remaining = 0; // כל הקוהורט קיבל הלוואה
        
        if (!params.allowNegativeCash && cash - totalLoanAmount < 0) {
          note += `הלוואות רגילות גרמו ליתרה שלילית; `;
        }
      }
    }

    // עדכון יתרה אחרי הלוואות רגילות
    cash -= loansStdOut + opexOut;

    // 7. אלגוריתם הלוואות מוקדמות (גרידי)
    if (params.early.enabled) {
      let earlyLoansThisMonth = 0;
      const maxEarlyThisMonth = params.early.maxPerMonth || Number.MAX_SAFE_INTEGER;
      
      // מיון קוהורטים לפי עדיפות (הוותקים ביותר קודם)
      const eligibleCohorts = cohorts
        .filter(c => c.remaining > 0 && t >= c.joinMonth && t < c.dueMonth)
        .sort((a, b) => a.joinMonth - b.joinMonth);
      
      for (const cohort of eligibleCohorts) {
        while (
          cohort.remaining > 0 &&
          earlyLoansThisMonth < maxEarlyThisMonth &&
          totalEarlyIssued < maxEarlyAllowed &&
          cash - params.early.minCashReserve >= params.std.amount
        ) {
          // הנפקת הלוואה מוקדמת אחת
          loansEarlyOut += params.std.amount;
          issuedEarly += 1;
          earlyLoansThisMonth += 1;
          cohort.remaining -= 1;
          cohort.receivedEarly += 1;
          totalEarlyIssued += 1;
          cash -= params.std.amount;
          
          // OPEX על הלוואה מוקדמת
          opexOut += calculateTotalOpex(params.opex, 'onloan', 1);
          cash -= calculateTotalOpex(params.opex, 'onloan', 1);
          
          // תזמון החזרים מוקדמים
          const earlyRepayment = calculateEarlyRepayment(
            params.std.repayMonthly,
            params.std.repayMonths,
            params.early.repayMonths,
            params.early.totalRepayEqualsStandard
          );
          
          scheduleRepay(
            repayEarlySchedule,
            t + 1, // החזר מתחיל מהחודש הבא
            params.early.repayMonths,
            earlyRepayment,
            1
          );
        }
      }
      
      if (earlyLoansThisMonth >= maxEarlyThisMonth) {
        note += `הגיע למגבלת הלוואות מוקדמות לחודש; `;
      }
      
      if (totalEarlyIssued >= maxEarlyAllowed) {
        note += `הגיע לתקרת אחוז מוקדמות (${params.early.maxPercent}%); `;
      }
    }

    // 8. חישוב התחייבויות עתידיות
    let outstandingObligations = 0;
    for (const cohort of cohorts) {
      outstandingObligations += cohort.remaining * params.std.amount;
    }

    // בדיקת יתרה שלילית
    if (cash < 0) {
      note += `יתרה שלילית: ${cash.toFixed(2)}; `;
    }

    if (cash < params.early.minCashReserve) {
      note += `מתחת לכרית מזומנים; `;
    }

    // שמירת נתוני החודש
    monthlyData.push({
      t,
      year,
      contribIn,
      repayStdIn,
      repayEarlyIn,
      yieldIn,
      loansStdOut,
      loansEarlyOut,
      opexOut,
      cashEnd: cash,
      issuedStd,
      issuedEarly,
      outstandingObligations,
      note: note.trim() || undefined
    });
  }

  // בניית תוצאות סופיות
  const yearly = buildYearlyData(monthlyData);
  const kpis = calculateKpis(monthlyData);

  return {
    monthly: monthlyData,
    yearly,
    kpis
  };
}

/**
 * מריץ סימולציות מרובות עם פרמטרים שונים
 * @param baseParams פרמטרי בסיס
 * @param variations וריאציות לבדיקה
 * @returns מערך תוצאות
 */
export function runMultipleSimulations(
  baseParams: Params,
  variations: Array<Partial<Params>>
): Results[] {
  return variations.map(variation => {
    const params = { ...baseParams, ...variation };
    return simulate(params);
  });
}

/**
 * משווה תוצאות של שתי סימולציות
 * @param results1 תוצאות ראשונות
 * @param results2 תוצאות שניות
 * @returns השוואה מפורטת
 */
export function compareResults(results1: Results, results2: Results) {
  return {
    kpiComparison: {
      percentEarlyDiff: results2.kpis.percentEarly - results1.kpis.percentEarly,
      totalEarlyDiff: results2.kpis.totalEarly - results1.kpis.totalEarly,
      totalStdDiff: results2.kpis.totalStd - results1.kpis.totalStd,
      minCashDiff: results2.kpis.minCash - results1.kpis.minCash,
      endCashDiff: results2.kpis.endCash - results1.kpis.endCash,
      negativeCashMonthsDiff: results2.kpis.negativeCashMonths - results1.kpis.negativeCashMonths
    },
    summary: {
      betterCashPosition: results2.kpis.endCash > results1.kpis.endCash,
      fewerNegativeMonths: results2.kpis.negativeCashMonths < results1.kpis.negativeCashMonths,
      higherEarlyRate: results2.kpis.percentEarly > results1.kpis.percentEarly
    }
  };
}
