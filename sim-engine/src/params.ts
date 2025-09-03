import { Params } from './types';

/**
 * פרמטרי ברירת המחדל למנוע הסימולציה
 */
export const defaultParams: Params = {
  intake: {
    newPerYear: 1000,
    years: 30
  },
  savings: {
    monthly: 40,
    months: 120
  },
  std: {
    amount: 40000,
    waitMonths: 240,
    repayMonthly: 400,
    repayMonths: 94,
    forgivenMonths: 6
  },
  early: {
    enabled: true,
    repayMonths: 67,
    totalRepayEqualsStandard: true,
    minCashReserve: 20000,
    maxPerMonth: undefined // ללא מגבלה
  },
  opex: {
    mode: 'MONTHLY',
    perUnitNis: 0,
    percentOf4800: 0
  },
  yield: {
    annualRate: 0,
    applyOnMinCash: false
  },
  allowNegativeCash: false
};

/**
 * פונקציה לוולידציה של פרמטרים
 */
export function validateParams(params: Params): string[] {
  const errors: string[] = [];

  // בדיקות בסיסיות
  if (params.intake.newPerYear <= 0) {
    errors.push('מספר מצטרפים חדשים חייב להיות חיובי');
  }
  
  if (params.intake.years <= 0) {
    errors.push('מספר שנים חייב להיות חיובי');
  }

  if (params.savings.monthly <= 0) {
    errors.push('תרומה חודשית חייבת להיות חיובית');
  }

  if (params.savings.months <= 0) {
    errors.push('מספר חודשי חיסכון חייב להיות חיובי');
  }

  if (params.std.amount <= 0) {
    errors.push('סכום הלוואה חייב להיות חיובי');
  }

  if (params.std.waitMonths < 0) {
    errors.push('תקופת המתנה לא יכולה להיות שלילית');
  }

  if (params.std.repayMonthly <= 0) {
    errors.push('החזר חודשי חייב להיות חיובי');
  }

  if (params.std.repayMonths <= 0) {
    errors.push('מספר חודשי החזר חייב להיות חיובי');
  }

  if (params.std.forgivenMonths < 0) {
    errors.push('מספר חודשי מחילה לא יכול להיות שלילי');
  }

  if (params.std.forgivenMonths >= params.std.repayMonths) {
    errors.push('מספר חודשי מחילה חייב להיות קטן ממספר חודשי החזר');
  }

  if (params.early.enabled) {
    if (params.early.repayMonths <= 0) {
      errors.push('מספר חודשי החזר למוקדמת חייב להיות חיובי');
    }

    if (params.early.minCashReserve < 0) {
      errors.push('כרית מזומנים לא יכולה להיות שלילית');
    }

    if (params.early.maxPerMonth !== undefined && params.early.maxPerMonth <= 0) {
      errors.push('מגבלת הלוואות לחודש חייבת להיות חיובית');
    }
  }

  if (params.opex.perUnitNis < 0) {
    errors.push('עלות ליחידה לא יכולה להיות שלילית');
  }

  if (params.opex.percentOf4800 < 0 || params.opex.percentOf4800 > 1) {
    errors.push('אחוז מ-4800 חייב להיות בין 0 ל-1');
  }

  if (params.yield.annualRate < 0 || params.yield.annualRate > 0.5) {
    errors.push('תשואה שנתית חייבת להיות בין 0 ל-50%');
  }

  return errors;
}
