import { MonthlyRow, YearRow, Kpis } from './types';
import { findWorstMonthIndex, countNegativeCashMonths, min, sum } from './utils';

/**
 * בונה נתונים שנתיים מתוך נתונים חודשיים
 * @param monthlyData נתונים חודשיים
 * @returns נתונים שנתיים
 */
export function buildYearlyData(monthlyData: MonthlyRow[]): YearRow[] {
  const yearlyData: YearRow[] = [];
  const yearMap = new Map<number, {
    inflows: number;
    outLoansStd: number;
    outLoansEarly: number;
    opex: number;
    issuedStd: number;
    issuedEarly: number;
    obligations: number;
  }>();

  // צבירת נתונים לפי שנים
  for (const month of monthlyData) {
    const year = month.year;
    
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        inflows: 0,
        outLoansStd: 0,
        outLoansEarly: 0,
        opex: 0,
        issuedStd: 0,
        issuedEarly: 0,
        obligations: 0
      });
    }

    const yearData = yearMap.get(year)!;
    
    // צבירת כניסות
    yearData.inflows += month.contribIn + month.repayStdIn + month.repayEarlyIn + month.yieldIn;
    
    // צבירת יציאות
    yearData.outLoansStd += month.loansStdOut;
    yearData.outLoansEarly += month.loansEarlyOut;
    yearData.opex += month.opexOut;
    
    // צבירת מספר הלוואות
    yearData.issuedStd += month.issuedStd;
    yearData.issuedEarly += month.issuedEarly;
    
    // התחייבויות (נלקח מהחודש האחרון בשנה)
    yearData.obligations = month.outstandingObligations;
  }

  // בניית מערך שנתי
  for (const [year, data] of yearMap.entries()) {
    const net = data.inflows - data.outLoansStd - data.outLoansEarly - data.opex;
    
    // מציאת יתרה בסוף השנה
    const lastMonthOfYear = monthlyData.find(m => 
      m.year === year && (m.year === monthlyData[monthlyData.length - 1].year || 
      monthlyData.find(next => next.year === year + 1) === undefined || 
      m.t === Math.max(...monthlyData.filter(x => x.year === year).map(x => x.t)))
    );
    
    const cashEnd = lastMonthOfYear?.cashEnd || 0;

    yearlyData.push({
      year,
      inflows: data.inflows,
      outLoansStd: data.outLoansStd,
      outLoansEarly: data.outLoansEarly,
      opex: data.opex,
      net,
      cashEnd,
      countEarly: data.issuedEarly,
      countStd: data.issuedStd,
      obligationsNis: data.obligations
    });
  }

  return yearlyData.sort((a, b) => a.year - b.year);
}

/**
 * מחשב מדדי ביצוע (KPIs) מתוך הנתונים החודשיים
 * @param monthlyData נתונים חודשיים
 * @returns מדדי ביצוע
 */
export function calculateKpis(monthlyData: MonthlyRow[]): Kpis {
  if (monthlyData.length === 0) {
    return {
      percentEarly: 0,
      totalEarly: 0,
      totalStd: 0,
      worstMonthIndex: 0,
      minCash: 0,
      endCash: 0,
      negativeCashMonths: 0
    };
  }

  // חישוב סך הלוואות
  const totalEarly = sum(monthlyData.map(m => m.issuedEarly));
  const totalStd = sum(monthlyData.map(m => m.issuedStd));
  const totalLoans = totalEarly + totalStd;
  
  // חישוב אחוז הלוואות מוקדמות
  const percentEarly = totalLoans > 0 ? (totalEarly / totalLoans) * 100 : 0;
  
  // מציאת חודש גרוע ביותר ויתרה מינימלית
  const cashArray = monthlyData.map(m => m.cashEnd);
  const worstMonthIndex = findWorstMonthIndex(cashArray);
  const minCash = min(cashArray);
  
  // יתרה סופית
  const endCash = monthlyData[monthlyData.length - 1].cashEnd;
  
  // מספר חודשים שליליים
  const negativeCashMonths = countNegativeCashMonths(cashArray);

  return {
    percentEarly: Math.round(percentEarly * 100) / 100, // עיגול ל-2 ספרות
    totalEarly,
    totalStd,
    worstMonthIndex,
    minCash,
    endCash,
    negativeCashMonths
  };
}

/**
 * מחשב סטטיסטיקות נוספות על הסימולציה
 * @param monthlyData נתונים חודשיים
 * @returns סטטיסטיקות מורחבות
 */
export function calculateExtendedStats(monthlyData: MonthlyRow[]) {
  if (monthlyData.length === 0) return null;

  const cashFlow = monthlyData.map(m => 
    (m.contribIn + m.repayStdIn + m.repayEarlyIn + m.yieldIn) - 
    (m.loansStdOut + m.loansEarlyOut + m.opexOut)
  );

  const totalContributions = sum(monthlyData.map(m => m.contribIn));
  const totalRepayments = sum(monthlyData.map(m => m.repayStdIn + m.repayEarlyIn));
  const totalLoansOut = sum(monthlyData.map(m => m.loansStdOut + m.loansEarlyOut));
  const totalOpex = sum(monthlyData.map(m => m.opexOut));
  const totalYield = sum(monthlyData.map(m => m.yieldIn));

  const avgCashFlow = sum(cashFlow) / cashFlow.length;
  const avgCash = sum(monthlyData.map(m => m.cashEnd)) / monthlyData.length;

  // מציאת תקופות של יתרה שלילית רצופה
  const negativePeriods: Array<{start: number, end: number, duration: number}> = [];
  let periodStart = -1;
  
  for (let i = 0; i < monthlyData.length; i++) {
    if (monthlyData[i].cashEnd < 0) {
      if (periodStart === -1) periodStart = i;
    } else {
      if (periodStart !== -1) {
        negativePeriods.push({
          start: periodStart,
          end: i - 1,
          duration: i - periodStart
        });
        periodStart = -1;
      }
    }
  }
  
  // אם הסימולציה מסתיימת בתקופה שלילית
  if (periodStart !== -1) {
    negativePeriods.push({
      start: periodStart,
      end: monthlyData.length - 1,
      duration: monthlyData.length - periodStart
    });
  }

  return {
    totalContributions,
    totalRepayments,
    totalLoansOut,
    totalOpex,
    totalYield,
    avgCashFlow,
    avgCash,
    negativePeriods,
    longestNegativePeriod: negativePeriods.length > 0 ? 
      Math.max(...negativePeriods.map(p => p.duration)) : 0
  };
}
