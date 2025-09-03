/**
 * סוגי עיתוי הוצאות תפעול
 */
export type OpexMode = 'UPFRONT' | 'MONTHLY' | 'ON_LOAN';

/**
 * פרמטרי מצטרפים חדשים
 */
export interface Intake {
  /** מספר מצטרפים חדשים בחודש */
  newPerMonth: number;
  /** אופק הסימולציה בשנים */
  years: number;
}

/**
 * פרמטרי חיסכון
 */
export interface Savings {
  /** סכום תרומה חודשית */
  monthly: number;
  /** מספר חודשי החיסכון */
  months: number;
}

/**
 * פרמטרי הלוואה רגילה
 */
export interface StandardLoan {
  /** סכום ההלוואה */
  amount: number;
  /** תקופת המתנה בחודשים */
  waitMonths: number;
  /** החזר חודשי */
  repayMonthly: number;
  /** מספר חודשי החזר */
  repayMonths: number;
  /** מספר חודשים של מחילת זנב */
  forgivenMonths: number;
}

/**
 * פרמטרי הלוואה מוקדמת
 */
export interface EarlyLoan {
  /** האם הלוואות מוקדמות מופעלות */
  enabled: boolean;
  /** מספר חודשי החזר למוקדמת */
  repayMonths: number;
  /** האם סכום החזר הכולל זהה לסטנדרט */
  totalRepayEqualsStandard: boolean;
  /** כרית מזומנים מינימלית */
  minCashReserve: number;
  /** תקרת אחוז מוקדמות מכלל היחידות */
  maxPercent?: number;
}

/**
 * פרמטרי הוצאות תפעול
 */
export interface Opex {
  /** מצב עיתוי החיוב */
  mode: OpexMode;
  /** סכום קבוע ליחידה בש"ח */
  perUnitNis: number;
  /** אחוז מ-4,800 ליחידה */
  percentOf4800: number;
}

/**
 * פרמטרי תשואה
 */
export interface Yield {
  /** שיעור תשואה שנתי */
  annualRate: number;
  /** האם להחיל רק על מזומנים מינימליים */
  applyOnMinCash?: boolean;
}

/**
 * פרמטרי הסימולציה המלאים
 */
export interface Params {
  intake: Intake;
  savings: Savings;
  std: StandardLoan;
  early: EarlyLoan;
  opex: Opex;
  yield: Yield;
  /** האם לאפשר יתרה שלילית */
  allowNegativeCash: boolean;
}

/**
 * נתוני שורה חודשית
 */
export interface MonthlyRow {
  /** חודש כולל (0-based) */
  t: number;
  /** שנה (1-based) */
  year: number;
  /** תרומות שנכנסו */
  contribIn: number;
  /** החזרי הלוואות רגילות */
  repayStdIn: number;
  /** החזרי הלוואות מוקדמות */
  repayEarlyIn: number;
  /** תשואה */
  yieldIn: number;
  /** הלוואות רגילות שיצאו */
  loansStdOut: number;
  /** הלוואות מוקדמות שיצאו */
  loansEarlyOut: number;
  /** הוצאות תפעול */
  opexOut: number;
  /** יתרה בסוף החודש */
  cashEnd: number;
  /** מספר הלוואות רגילות שהונפקו */
  issuedStd: number;
  /** מספר הלוואות מוקדמות שהונפקו */
  issuedEarly: number;
  /** התחייבויות עתידיות בש"ח */
  outstandingObligations: number;
  /** הערות */
  note?: string;
}

/**
 * נתוני שורה שנתית
 */
export interface YearRow {
  /** שנה */
  year: number;
  /** כניסות כולל */
  inflows: number;
  /** יציאות הלוואות רגילות */
  outLoansStd: number;
  /** יציאות הלוואות מוקדמות */
  outLoansEarly: number;
  /** הוצאות תפעול */
  opex: number;
  /** תזרים נטו */
  net: number;
  /** יתרה בסוף השנה */
  cashEnd: number;
  /** מספר הלוואות מוקדמות */
  countEarly: number;
  /** מספר הלוואות רגילות */
  countStd: number;
  /** התחייבויות בש"ח */
  obligationsNis: number;
}

/**
 * מדדי ביצוע (KPIs)
 */
export interface Kpis {
  /** אחוז הלוואות מוקדמות */
  percentEarly: number;
  /** סך הלוואות מוקדמות */
  totalEarly: number;
  /** סך הלוואות רגילות */
  totalStd: number;
  /** אינדקס החודש הגרוע ביותר */
  worstMonthIndex: number;
  /** החודש הגרוע ביותר בפורמט YYYY-MM */
  worstMonthFormatted: string;
  /** יתרה מינימלית */
  minCash: number;
  /** יתרה סופית */
  endCash: number;
  /** מספר חודשים עם יתרה שלילית */
  negativeCashMonths: number;
}

/**
 * תוצאות הסימולציה
 */
export interface Results {
  /** נתונים חודשיים */
  monthly: MonthlyRow[];
  /** נתונים שנתיים */
  yearly: YearRow[];
  /** מדדי ביצוע */
  kpis: Kpis;
}

/**
 * נתוני קוהורט (קבוצת מצטרפים)
 */
export interface Cohort {
  /** חודש הצטרפות */
  joinMonth: number;
  /** חודש זכאות להלוואה רגילה */
  dueMonth: number;
  /** מספר משתתפים בקוהורט */
  size: number;
  /** מספר שטרם קיבלו הלוואה */
  remaining: number;
  /** מספר שקיבלו הלוואה מוקדמת */
  receivedEarly: number;
  /** האם הקוהורט עדיין פעיל בחיסכון */
  isActive: boolean;
}
