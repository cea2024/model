import { Opex, OpexMode } from './types';

/**
 * מחשב את עלות התפעול הבסיסית ליחידה
 * @param opex פרמטרי הוצאות התפעול
 * @returns עלות ליחידה
 */
export function calculateUnitCost(opex: Opex): number {
  return opex.perUnitNis + (opex.percentOf4800 * 4800);
}

/**
 * מחשב הוצאות תפעול למצב UPFRONT
 * @param opex פרמטרי הוצאות התפעול
 * @param newUnits מספר יחידות חדשות שהצטרפו
 * @returns סכום הוצאות התפעול
 */
export function calculateUpfrontOpex(opex: Opex, newUnits: number): number {
  if (opex.mode !== 'UPFRONT') return 0;
  return calculateUnitCost(opex) * newUnits;
}

/**
 * מחשב הוצאות תפעול למצב MONTHLY
 * @param opex פרמטרי הוצאות התפעול
 * @param activeUnits מספר יחידות פעילות
 * @param savingsMonths מספר חודשי חיסכון
 * @returns סכום הוצאות התפעול החודשי
 */
export function calculateMonthlyOpex(
  opex: Opex,
  activeUnits: number,
  savingsMonths: number
): number {
  if (opex.mode !== 'MONTHLY') return 0;
  const unitCost = calculateUnitCost(opex);
  // עלות חודשית = עלות כוללת מחולקת על מספר חודשי החיסכון
  return (unitCost / savingsMonths) * activeUnits;
}

/**
 * מחשב הוצאות תפעול למצב ON_LOAN
 * @param opex פרמטרי הוצאות התפעול
 * @param loansIssued מספר הלוואות שהונפקו
 * @returns סכום הוצאות התפעול
 */
export function calculateOnLoanOpex(opex: Opex, loansIssued: number): number {
  if (opex.mode !== 'ON_LOAN') return 0;
  return calculateUnitCost(opex) * loansIssued;
}

/**
 * מחשב את סך הוצאות התפעול לחודש נתון
 * @param opex פרמטרי הוצאות התפעול
 * @param mode מצב החישוב הנוכחי
 * @param units מספר יחידות רלוונטי
 * @param savingsMonths מספר חודשי חיסכון (רק ל-MONTHLY)
 * @returns סכום הוצאות התפעול
 */
export function calculateTotalOpex(
  opex: Opex,
  mode: 'upfront' | 'monthly' | 'onloan',
  units: number,
  savingsMonths?: number
): number {
  switch (mode) {
    case 'upfront':
      return calculateUpfrontOpex(opex, units);
    case 'monthly':
      if (savingsMonths === undefined) {
        throw new Error('savingsMonths is required for monthly opex calculation');
      }
      return calculateMonthlyOpex(opex, units, savingsMonths);
    case 'onloan':
      return calculateOnLoanOpex(opex, units);
    default:
      return 0;
  }
}

/**
 * מחזיר את סוג הוצאות התפעול כמחרוזת לצורכי דיבוג
 * @param mode מצב הוצאות התפעול
 * @returns תיאור המצב
 */
export function getOpexModeDescription(mode: OpexMode): string {
  switch (mode) {
    case 'UPFRONT':
      return 'חיוב חד-פעמי בעת הצטרפות';
    case 'MONTHLY':
      return 'חיוב חודשי במהלך תקופת החיסכון';
    case 'ON_LOAN':
      return 'חיוב בעת קבלת הלוואה';
    default:
      return 'מצב לא מוכר';
  }
}
