/**
 * פונקציות עזר לתזמון החזרי הלוואות
 */

/**
 * מוסיף סכומי החזר למערך החודשים הבאים
 * @param arr מערך החזרים החודשיים
 * @param start חודש התחלה
 * @param months מספר חודשי החזר
 * @param amount סכום החזר חודשי
 * @param count מספר הלוואות
 */
export function scheduleRepay(
  arr: Float64Array,
  start: number,
  months: number,
  amount: number,
  count: number
): void {
  for (let i = 0; i < months && start + i < arr.length; i++) {
    arr[start + i] += amount * count;
  }
}

/**
 * מחשב את חודש ההצטרפות של קוהורט
 * @param yearIndex אינדקס השנה (0-based)
 * @returns חודש ההצטרפות
 */
export function joinMonth(yearIndex: number): number {
  return yearIndex * 12; // כל קוהורט מצטרף בינואר
}

/**
 * מחשב את חודש הזכאות להלוואה רגילה
 * @param joinMonth חודש ההצטרפות
 * @param waitMonths תקופת המתנה
 * @returns חודש הזכאות
 */
export function dueMonth(joinMonth: number, waitMonths: number): number {
  return joinMonth + waitMonths;
}

/**
 * בודק האם קוהורט עדיין פעיל בחיסכון
 * @param currentMonth החודש הנוכחי
 * @param joinMonth חודש ההצטרפות
 * @param savingsMonths מספר חודשי חיסכון
 * @returns האם הקוהורט פעיל
 */
export function isCohortActive(
  currentMonth: number,
  joinMonth: number,
  savingsMonths: number
): boolean {
  return currentMonth >= joinMonth && currentMonth < joinMonth + savingsMonths;
}

/**
 * מחשב את מספר החודשים שקוהורט היה פעיל עד כה
 * @param currentMonth החודש הנוכחי
 * @param joinMonth חודש ההצטרפות
 * @param savingsMonths מספר חודשי חיסכון
 * @returns מספר חודשים פעילים
 */
export function getActiveMonths(
  currentMonth: number,
  joinMonth: number,
  savingsMonths: number
): number {
  if (currentMonth < joinMonth) return 0;
  return Math.min(currentMonth - joinMonth + 1, savingsMonths);
}

/**
 * מחשב את השנה מתוך חודש כולל
 * @param month חודש כולל (0-based)
 * @returns שנה (1-based)
 */
export function getYear(month: number): number {
  return Math.floor(month / 12) + 1;
}

/**
 * מחשב את החודש בשנה מתוך חודש כולל
 * @param month חודש כולל (0-based)
 * @returns חודש בשנה (0-11)
 */
export function getMonthInYear(month: number): number {
  return month % 12;
}
