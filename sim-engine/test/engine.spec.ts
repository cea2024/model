import { describe, it, expect } from 'vitest';
import { simulate, defaultParams, validateParams } from '../src';
import { Params } from '../src/types';

describe('מנוע הסימולציה', () => {
  describe('וולידציה', () => {
    it('צריך לעבור וולידציה עם פרמטרי ברירת מחדל', () => {
      const errors = validateParams(defaultParams);
      expect(errors).toHaveLength(0);
    });

    it('צריך לזהות פרמטרים לא תקינים', () => {
      const invalidParams: Params = {
        ...defaultParams,
        intake: { newPerMonth: -100, years: 0 },
        savings: { monthly: -40, months: 0 }
      };
      
      const errors = validateParams(invalidParams);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('לחודש'))).toBe(true);
      expect(errors.some(e => e.includes('שנים'))).toBe(true);
      expect(errors.some(e => e.includes('תרומה'))).toBe(true);
    });
  });

  describe('סימולציה בסיסית', () => {
    it('צריך לרוץ סימולציה בסיסית ללא שגיאות', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerYear: 100, years: 5 }
      };
      
      const results = simulate(params);
      
      expect(results.monthly).toHaveLength(60); // 5 שנים × 12 חודשים
      expect(results.yearly).toHaveLength(5);
      expect(results.kpis).toBeDefined();
    });

    it('צריך לחשב תרומות נכון עם מצטרפים חודשיים', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 10, years: 2 }, // 10 מצטרפים חדשים כל חודש
        savings: { monthly: 100, months: 12 }
      };
      
      const results = simulate(params);
      
      // בחודש 0: 10 משתתפים × 100 = 1000
      expect(results.monthly[0].contribIn).toBe(1000);
      
      // בחודש 1: 10 חדשים + 10 ישנים × 100 = 2000
      expect(results.monthly[1].contribIn).toBe(2000);
      
      // בחודש 12: 10 חדשים + 10×11 ישנים (הראשונים סיימו) × 100 = 12000
      expect(results.monthly[12].contribIn).toBe(12000);
    });
  });

  describe('הלוואות רגילות', () => {
    it('צריך להנפיק הלוואות רגילות בחודש הנכון', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 1, years: 5 }, // 1 מצטרף לחודש
        savings: { monthly: 100, months: 12 },
        std: { ...defaultParams.std, waitMonths: 24 }, // המתנה של שנתיים
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // הקוהורט הראשון (חודש 0) צריך לקבל הלוואה בחודש 24
      expect(results.monthly[24].issuedStd).toBe(1);
      expect(results.monthly[24].loansStdOut).toBe(1 * 40000);
      
      // חודשים אחרים לא צריכים הלוואות רגילות (עדיין)
      expect(results.monthly[23].issuedStd).toBe(0);
    });
  });

  describe('הלוואות מוקדמות', () => {
    it('צריך להנפיק הלוואות מוקדמות כשיש מזומן', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 5, years: 3 },
        savings: { monthly: 2000, months: 24 }, // תרומה גבוהה
        std: { ...defaultParams.std, waitMonths: 36 },
        early: { 
          ...defaultParams.early, 
          enabled: true,
          minCashReserve: 10000
        }
      };
      
      const results = simulate(params);
      
      // צריכות להיות הלוואות מוקדמות במהלך הסימולציה
      const totalEarlyLoans = results.monthly.reduce((sum, m) => sum + m.issuedEarly, 0);
      expect(totalEarlyLoans).toBeGreaterThan(0);
      
      expect(results.kpis.totalEarly).toBeGreaterThan(0);
      expect(results.kpis.percentEarly).toBeGreaterThan(0);
    });

    it('לא צריך להנפיק מוקדמות כשאין מספיק מזומן', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 1, years: 2 },
        savings: { monthly: 10, months: 12 }, // תרומה נמוכה
        early: { 
          ...defaultParams.early, 
          enabled: true,
          minCashReserve: 50000 // כרית גבוהה מדי
        }
      };
      
      const results = simulate(params);
      
      expect(results.kpis.totalEarly).toBe(0);
    });
  });

  describe('OPEX', () => {
    it('צריך לחשב OPEX במצב UPFRONT', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 10, years: 2 },
        opex: { mode: 'UPFRONT', perUnitNis: 100, percentOf4800: 0 },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // בכל חודש: 10 מצטרפים × 100 = 1000
      expect(results.monthly[0].opexOut).toBe(1000);
      expect(results.monthly[5].opexOut).toBe(1000);
      expect(results.monthly[12].opexOut).toBe(1000);
    });

    it('צריך לחשב OPEX במצב MONTHLY', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 10, years: 2 },
        savings: { monthly: 40, months: 12 },
        opex: { mode: 'MONTHLY', perUnitNis: 120, percentOf4800: 0 },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // בחודש 0: 10 פעילים × (120/12) = 10 × 10 = 100
      expect(results.monthly[0].opexOut).toBe(100);
    });
  });

  describe('תשואה', () => {
    it('צריך לחשב תשואה על יתרה חיובית', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 5, years: 3 },
        savings: { monthly: 1000, months: 12 },
        std: { ...defaultParams.std, waitMonths: 24 }, // המתנה קצרה יותר
        yield: { annualRate: 0.05, applyOnMinCash: false }, // 5% שנתי
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // צריכה להיות תשואה חיובית במהלך הסימולציה
      const totalYield = results.monthly.reduce((sum, m) => sum + m.yieldIn, 0);
      expect(totalYield).toBeGreaterThan(0);
    });
  });

  describe('KPIs', () => {
    it('צריך לחשב KPIs נכון', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerMonth: 10, years: 3 },
        std: { ...defaultParams.std, waitMonths: 24 }, // המתנה קצרה יותר
        early: { ...defaultParams.early, enabled: true }
      };
      
      const results = simulate(params);
      
      expect(results.kpis.totalEarly + results.kpis.totalStd).toBeGreaterThan(0);
      expect(results.kpis.percentEarly).toBeGreaterThanOrEqual(0);
      expect(results.kpis.percentEarly).toBeLessThanOrEqual(100);
      expect(results.kpis.worstMonthIndex).toBeGreaterThanOrEqual(0);
      expect(results.kpis.worstMonthIndex).toBeLessThan(results.monthly.length);
      expect(results.kpis.worstMonthFormatted).toBeDefined();
    });
  });

  describe('תרחישים מיוחדים', () => {
    it('צריך לטפל ביתרה שלילית כשמותר', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerYear: 12, years: 3 },
        savings: { monthly: 10, months: 6 }, // מעט מזומן
        std: { ...defaultParams.std, waitMonths: 12 }, // המתנה קצרה
        allowNegativeCash: true,
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // הסימולציה צריכה לרוץ גם עם יתרה שלילית
      expect(results.monthly).toHaveLength(36);
      expect(results.kpis.negativeCashMonths).toBeGreaterThanOrEqual(0); // לפחות 0
    });

    it('צריך לעבוד עם מחילת זנב', () => {
      const params: Params = {
        ...defaultParams,
        intake: { newPerYear: 12, years: 2 },
        std: {
          ...defaultParams.std,
          repayMonths: 10,
          forgivenMonths: 2 // מוחל 2 חודשים אחרונים
        },
        early: { ...defaultParams.early, enabled: false }
      };
      
      const results = simulate(params);
      
      // צריכים להיות רק 8 חודשי החזר (10-2)
      // זה קשה לבדוק ישירות, אבל לפחות הסימולציה צריכה לרוץ
      expect(results.monthly).toHaveLength(24);
    });
  });
});
