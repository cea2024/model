/**
 * פונקציות עזר כלליות למנוע הסימולציה
 */

/**
 * מחשב ריבית חודשית מריבית שנתית
 * @param annualRate ריבית שנתית (0-1)
 * @returns ריבית חודשית
 */
export function calculateMonthlyRate(annualRate: number): number {
  if (annualRate === 0) return 0;
  return Math.pow(1 + annualRate, 1/12) - 1;
}

/**
 * מחשב תשואה חודשית על יתרה
 * @param cash יתרה נוכחית
 * @param monthlyRate ריבית חודשית
 * @param applyOnMinCash האם להחיל רק על מזומנים חיוביים
 * @returns תשואה חודשית
 */
export function calculateYield(
  cash: number,
  monthlyRate: number,
  applyOnMinCash: boolean = false
): number {
  if (monthlyRate === 0) return 0;
  const applicableCash = applyOnMinCash ? Math.max(0, cash) : cash;
  return applicableCash > 0 ? applicableCash * monthlyRate : 0;
}

/**
 * מחשב סכום החזר חודשי להלוואה מוקדמת
 * @param stdRepayMonthly החזר חודשי רגיל
 * @param stdRepayMonths מספר חודשי החזר הרגיל
 * @param earlyRepayMonths מספר חודשי החזר המוקדם
 * @param totalRepayEquals האם סכום החזר הכולל זהה
 * @returns החזר חודשי מוקדם
 */
export function calculateEarlyRepayment(
  stdRepayMonthly: number,
  stdRepayMonths: number,
  earlyRepayMonths: number,
  totalRepayEquals: boolean
): number {
  if (!totalRepayEquals) {
    // אם לא נדרש שוויון, נחזיר את הסכום הרגיל (ניתן לשנות בעתיד)
    return stdRepayMonthly;
  }
  
  // חישוב כך שסכום החזר הכולל יהיה זהה
  const totalRepay = stdRepayMonthly * stdRepayMonths;
  return totalRepay / earlyRepayMonths;
}

/**
 * מוצא את האינדקס של החודש עם היתרה הנמוכה ביותר
 * @param cashArray מערך יתרות חודשיות
 * @returns אינדקס החודש הגרוע ביותר
 */
export function findWorstMonthIndex(cashArray: number[]): number {
  let minCash = cashArray[0];
  let worstIndex = 0;
  
  for (let i = 1; i < cashArray.length; i++) {
    if (cashArray[i] < minCash) {
      minCash = cashArray[i];
      worstIndex = i;
    }
  }
  
  return worstIndex;
}

/**
 * סופר מספר חודשים עם יתרה שלילית
 * @param cashArray מערך יתרות חודשיות
 * @returns מספר חודשים שליליים
 */
export function countNegativeCashMonths(cashArray: number[]): number {
  return cashArray.filter(cash => cash < 0).length;
}

/**
 * מחשב סכום מצטבר של מערך
 * @param array המערך לחישוב
 * @returns סכום מצטבר
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * מחשב ממוצע של מערך
 * @param array המערך לחישוב
 * @returns ממוצע
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * מוצא ערך מינימלי במערך
 * @param array המערך לחיפוש
 * @returns ערך מינימלי
 */
export function min(array: number[]): number {
  return Math.min(...array);
}

/**
 * מוצא ערך מקסימלי במערך
 * @param array המערך לחיפוש
 * @returns ערך מקסימלי
 */
export function max(array: number[]): number {
  return Math.max(...array);
}

/**
 * מעגל מספר לדיוק נתון
 * @param num המספר לעיגול
 * @param decimals מספר ספרות אחרי הנקודה
 * @returns מספר מעוגל
 */
export function round(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * בודק האם מספר נמצא בטווח נתון
 * @param value הערך לבדיקה
 * @param min ערך מינימלי
 * @param max ערך מקסימלי
 * @returns האם הערך בטווח
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * מגביל ערך לטווח נתון
 * @param value הערך להגבלה
 * @param min ערך מינימלי
 * @param max ערך מקסימלי
 * @returns ערך מוגבל
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
