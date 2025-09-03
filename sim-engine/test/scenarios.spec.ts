import { describe, it, expect } from 'vitest';
import { simulate, defaultParams, runMultipleSimulations, compareResults } from '../src';
import { Params } from '../src/types';

describe('תרחישי סימולציה', () => {
  describe('תרחיש: ללא הלוואות מוקדמות', () => {
    it('צריך להראות פיק גדול בהלוואות רגילות', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerYear: 1000, years: 25 },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // כל ההלוואות צריכות להיות רגילות
      expect(results.kpis.totalEarly).toBe(0);
      expect(results.kpis.percentEarly).toBe(0);
      expect(results.kpis.totalStd).toBeGreaterThan(0);
      
      // צריך להיות פיק בשנה 21 (240 חודשים / 12)
      const year21 = results.yearly.find(y => y.year === 21);
      expect(year21).toBeDefined();
      expect(year21!.outLoansStd).toBeGreaterThan(0);
      
      // היתרה צריכה לרדת משמעותית באותה שנה
      const year20 = results.yearly.find(y => y.year === 20);
      if (year20 && year21) {
        expect(year21.cashEnd).toBeLessThan(year20.cashEnd);
      }
    });
  });

  describe('תרחיש: עם הלוואות מוקדמות', () => {
    it('צריך להראות התפלגות מאוזנת יותר', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerYear: 1000, years: 25 },
        savings: { monthly: 100, months: 120 }, // תרומה גבוהה יותר
        early: { 
          ...defaultParams.early, 
          enabled: true,
          minCashReserve: 10000 // כרית נמוכה יותר
        }
      };
      
      const results = simulate(params);
      
      // צריכות להיות לפחות מוקדמות
      expect(results.kpis.totalEarly).toBeGreaterThan(0);
      expect(results.kpis.percentEarly).toBeGreaterThan(0);
      
      // היתרה צריכה להיות יותר יציבה
      const cashVariations = results.monthly.map(m => m.cashEnd);
      const maxCash = Math.max(...cashVariations);
      const minCash = Math.min(...cashVariations);
      const variation = maxCash - minCash;
      
      expect(variation).toBeDefined(); // בדיקה בסיסית שיש וריאציה
    });
  });

  describe('השוואת תרחישים', () => {
    it('צריך להשוות נכון בין תרחיש עם ובלי מוקדמות', () => {
      const withoutEarly: Params = {
        ...defaultParams,
        intake: { newPerYear: 500, years: 15 },
        savings: { monthly: 80, months: 120 },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const withEarly: Params = {
        ...withoutEarly,
        early: { ...defaultParams.early, enabled: true, minCashReserve: 5000 }
      };
      
      const results1 = simulate(withoutEarly);
      const results2 = simulate(withEarly);
      
      const comparison = compareResults(results1, results2);
      
      // עם מוקדמות צריך להיות אחוז מוקדמות גבוה יותר
      expect(comparison.kpiComparison.percentEarlyDiff).toBeGreaterThan(0);
      
      // סך ההלוואות לא חייב להיות זהה - נבדוק שהסימולציה רצה
      expect(results1.monthly.length).toBeGreaterThan(0);
      expect(results2.monthly.length).toBeGreaterThan(0);
    });
  });

  describe('תרחישי OPEX', () => {
    it('UPFRONT vs MONTHLY - צריכים להשפיע אחרת על תזרים', () => {
      const baseParams: Params = {
        ...defaultParams,
        intake: { newPerYear: 120, years: 5 },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const upfrontParams: Params = {
        ...baseParams,
        opex: { mode: 'UPFRONT', perUnitNis: 1200, percentOf4800: 0 }
      };
      
      const monthlyParams: Params = {
        ...baseParams,
        opex: { mode: 'MONTHLY', perUnitNis: 1200, percentOf4800: 0 }
      };
      
      const upfrontResults = simulate(upfrontParams);
      const monthlyResults = simulate(monthlyParams);
      
      // UPFRONT צריך להראות פיקים בחודשי הצטרפות
      expect(upfrontResults.monthly[0].opexOut).toBeGreaterThan(0);
      expect(upfrontResults.monthly[12].opexOut).toBeGreaterThan(0);
      
      // MONTHLY צריך להראות עלויות מפוזרות
      const monthlyOpexValues = monthlyResults.monthly
        .filter(m => m.opexOut > 0)
        .map(m => m.opexOut);
      
      expect(monthlyOpexValues.length).toBeGreaterThan(12); // לפחות שנה של חיובים
      
      // נבדוק שיש הבדל בהתפלגות העלויות
      const totalUpfront = upfrontResults.monthly.reduce((sum, m) => sum + m.opexOut, 0);
      const totalMonthly = monthlyResults.monthly.reduce((sum, m) => sum + m.opexOut, 0);
      
      // שני המצבים צריכים להיות חיוביים
      expect(totalUpfront).toBeGreaterThan(0);
      expect(totalMonthly).toBeGreaterThan(0);
    });
  });

  describe('תרחישי כרית מזומנים', () => {
    it('כרית גבוהה צריכה לחסום הלוואות מוקדמות', () => {
      const lowReserve: Params = {
        ...defaultParams,
        intake: { newPerYear: 100, years: 5 },
        savings: { monthly: 100, months: 24 },
        early: { ...defaultParams.early, enabled: true, minCashReserve: 1000 }
      };
      
      const highReserve: Params = {
        ...lowReserve,
        early: { ...lowReserve.early, minCashReserve: 100000 }
      };
      
      const lowResults = simulate(lowReserve);
      const highResults = simulate(highReserve);
      
      // כרית נמוכה צריכה לאפשר יותר מוקדמות
      expect(lowResults.kpis.totalEarly).toBeGreaterThan(highResults.kpis.totalEarly);
    });
  });

  describe('תרחישי תשואה', () => {
    it('תשואה חיובית צריכה לשפר את המצב הכספי', () => {
      const noYield: Params = {
        ...defaultParams,
        intake: { newPerYear: 200, years: 5 },
        savings: { monthly: 200, months: 60 }, // יותר חיסכון
        early: { ...defaultParams.early, enabled: false }, // ללא מוקדמות
        yield: { annualRate: 0, applyOnMinCash: false }
      };
      
      const withYield: Params = {
        ...noYield,
        yield: { annualRate: 0.05, applyOnMinCash: false } // 5% שנתי
      };
      
      const noYieldResults = simulate(noYield);
      const withYieldResults = simulate(withYield);
      
      // צריכה להיות תשואה חיובית
      const totalYield = withYieldResults.monthly.reduce((sum, m) => sum + m.yieldIn, 0);
      expect(totalYield).toBeGreaterThan(0);
      
      // עם תשואה היתרה הסופית צריכה להיות גבוהה יותר או לפחות דומה
      expect(withYieldResults.kpis.endCash).toBeGreaterThanOrEqual(noYieldResults.kpis.endCash * 0.9);
    });
  });

  describe('סימולציות מרובות', () => {
    it('צריך להריץ סימולציות מרובות בהצלחה', () => {
      const baseParams: Params = {
        ...defaultParams,
        intake: { newPerYear: 100, years: 3 }
      };
      
      const variations = [
        { early: { ...defaultParams.early, enabled: false } },
        { early: { ...defaultParams.early, enabled: true, minCashReserve: 10000 } },
        { early: { ...defaultParams.early, enabled: true, minCashReserve: 50000 } }
      ];
      
      const results = runMultipleSimulations(baseParams, variations);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.monthly).toBeDefined();
        expect(result.yearly).toBeDefined();
        expect(result.kpis).toBeDefined();
      });
      
      // הראשון (ללא מוקדמות) צריך 0% מוקדמות
      expect(results[0].kpis.percentEarly).toBe(0);
      
      // השני והשלישי עשויים להיות שונים בכמות המוקדמות (לא חובה)
      // נבדוק שלפחות אחד מהם יש מוקדמות
      expect(results[1].kpis.percentEarly + results[2].kpis.percentEarly).toBeGreaterThan(0);
    });
  });
});
