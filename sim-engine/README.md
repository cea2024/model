# @gemach/sim-engine

מנוע סימולציה כלכלי עבור הגמ"ח המרכזי

## תיאור

מנוע סימולציה דטרמיניסטי המדמה את פעילות הגמ"ח על פני תקופה של שנים רבות. המנוע מאפשר לנתח את ההשפעה של פרמטרים שונים על יציבות הקופה, תזרים המזומנים, והתחייבויות עתידיות.

## התקנה

```bash
npm install @gemach/sim-engine
```

## שימוש בסיסי

```typescript
import { simulate, defaultParams } from '@gemach/sim-engine';

const params = {
  ...defaultParams,
  intake: { newPerYear: 1000, years: 30 },
  early: { 
    ...defaultParams.early, 
    enabled: true, 
    repayMonths: 67, 
    minCashReserve: 20000 
  },
  opex: { mode: 'MONTHLY', perUnitNis: 0, percentOf4800: 0.01 },
};

const results = simulate(params);

console.log('מדדי ביצוע:', results.kpis);
console.log('5 השנים הראשונות:', results.yearly.slice(0, 5));
```

## פרמטרים

### מצטרפים חדשים (Intake)
- `newPerYear`: מספר מצטרפים חדשים בשנה
- `years`: אופק הסימולציה בשנים

### חיסכון (Savings)
- `monthly`: סכום תרומה חודשית (₪)
- `months`: מספר חודשי החיסכון

### הלוואה רגילה (StandardLoan)
- `amount`: סכום ההלוואה (₪)
- `waitMonths`: תקופת המתנה בחודשים
- `repayMonthly`: החזר חודשי (₪)
- `repayMonths`: מספר חודשי החזר
- `forgivenMonths`: מספר חודשים של מחילת זנב

### הלוואה מוקדמת (EarlyLoan)
- `enabled`: האם הלוואות מוקדמות מופעלות
- `repayMonths`: מספר חודשי החזר למוקדמת
- `totalRepayEqualsStandard`: האם סכום החזר הכולל זהה לסטנדרט
- `minCashReserve`: כרית מזומנים מינימלית (₪)
- `maxPerMonth`: מגבלת הלוואות מוקדמות לחודש (אופציונלי)

### הוצאות תפעול (Opex)
- `mode`: מצב עיתוי החיוב (`'UPFRONT' | 'MONTHLY' | 'ON_LOAN'`)
- `perUnitNis`: סכום קבוע ליחידה (₪)
- `percentOf4800`: אחוז מ-4,800 ליחידה

### תשואה (Yield)
- `annualRate`: שיעור תשואה שנתי (0-0.5)
- `applyOnMinCash`: האם להחיל רק על מזומנים חיוביים

### הגדרות כלליות
- `allowNegativeCash`: האם לאפשר יתרה שלילית

## אלגוריתם הסימולציה

### מחזור חודשי
1. **חישוב תרומות**: כל קוהורט פעיל תורם לפי הפרמטרים
2. **החזרי הלוואות**: החזרים מתוזמנים מראש מתווספים ליתרה
3. **תשואה**: חישוב תשואה חודשית על היתרה (אם מופעל)
4. **הוצאות תפעול**: לפי המצב הנבחר (UPFRONT/MONTHLY/ON_LOAN)
5. **הלוואות רגילות**: בחודש ה-due של כל קוהורט
6. **הלוואות מוקדמות**: אלגוריתם גרידי בכפוף לכרית מזומנים

### אלגוריתם הלוואות מוקדמות
- מיון קוהורטים לפי עדיפות (הוותקים ביותר קודם)
- בדיקת זמינות מזומנים: `cash - reserve >= loan_amount`
- הנפקה עד למגבלה החודשית (אם קיימת)
- תזמון החזרים לפי הפרמטרים

## תוצאות

### נתונים חודשיים (MonthlyRow)
```typescript
interface MonthlyRow {
  t: number;                    // חודש כולל
  year: number;                 // שנה
  contribIn: number;            // תרומות
  repayStdIn: number;           // החזר רגיל
  repayEarlyIn: number;         // החזר מוקדם
  yieldIn: number;              // תשואה
  loansStdOut: number;          // הלוואות רגילות
  loansEarlyOut: number;        // הלוואות מוקדמות
  opexOut: number;              // הוצאות תפעול
  cashEnd: number;              // יתרה סופית
  issuedStd: number;            // מספר הלוואות רגילות
  issuedEarly: number;          // מספר הלוואות מוקדמות
  outstandingObligations: number; // התחייבויות עתידיות
  note?: string;                // הערות
}
```

### מדדי ביצוע (KPIs)
```typescript
interface Kpis {
  percentEarly: number;         // אחוז הלוואות מוקדמות
  totalEarly: number;           // סך הלוואות מוקדמות
  totalStd: number;             // סך הלוואות רגילות
  worstMonthIndex: number;      // אינדקס החודש הגרוע ביותר
  minCash: number;              // יתרה מינימלית
  endCash: number;              // יתרה סופית
  negativeCashMonths: number;   // חודשים עם יתרה שלילית
}
```

## פונקציות מתקדמות

### סימולציות מרובות
```typescript
import { runMultipleSimulations } from '@gemach/sim-engine';

const baseParams = { ...defaultParams };
const variations = [
  { early: { ...defaultParams.early, enabled: false } },
  { early: { ...defaultParams.early, enabled: true, minCashReserve: 10000 } },
  { early: { ...defaultParams.early, enabled: true, minCashReserve: 50000 } }
];

const results = runMultipleSimulations(baseParams, variations);
```

### השוואת תוצאות
```typescript
import { compareResults } from '@gemach/sim-engine';

const comparison = compareResults(results1, results2);
console.log('הבדל באחוז מוקדמות:', comparison.kpiComparison.percentEarlyDiff);
```

### אנליטיקה מורחבת
```typescript
import { calculateExtendedStats } from '@gemach/sim-engine';

const stats = calculateExtendedStats(results.monthly);
console.log('תקופות יתרה שלילית:', stats.negativePeriods);
```

## דוגמאות תרחישים

### תרחיש 1: ללא הלוואות מוקדמות
```typescript
const withoutEarly = {
  ...defaultParams,
  intake: { newPerYear: 1000, years: 25 },
  early: { ...defaultParams.early, enabled: false }
};
```
**תוצאה צפויה**: פיק גדול בהלוואות רגילות בשנה 21, ירידה חדה ביתרה.

### תרחיש 2: עם הלוואות מוקדמות
```typescript
const withEarly = {
  ...defaultParams,
  intake: { newPerYear: 1000, years: 25 },
  early: { 
    ...defaultParams.early, 
    enabled: true,
    minCashReserve: 50000
  }
};
```
**תוצאה צפויה**: התפלגות מאוזנת יותר, יתרה יציבה יותר, אחוז גבוה של מוקדמות.

### תרחיש 3: השוואת מצבי OPEX
```typescript
const upfront = {
  ...defaultParams,
  opex: { mode: 'UPFRONT', perUnitNis: 1200, percentOf4800: 0 }
};

const monthly = {
  ...defaultParams,
  opex: { mode: 'MONTHLY', perUnitNis: 1200, percentOf4800: 0 }
};
```

## פיתוח ובדיקות

### הרצת בדיקות
```bash
npm test
```

### בנייה
```bash
npm run build
```

### פיתוח עם watch
```bash
npm run dev
```

## מגבלות ושיקולים

1. **דטרמיניסטיות**: המנוע אינו כולל אקראיות או סיכונים
2. **הנחות פשטניות**: מודל מפושט של התנהגות משתתפים
3. **ביצועים**: מותאם לסימולציות של עד 50 שנים עם אלפי משתתפים
4. **דיוק**: נתוני דמה - לא מיועד לשימוש פיננסי אמיתי

## רישיון

MIT

## תרומה

ברוכים הבאים לתרום לפרויקט! אנא פתחו Issues או Pull Requests.

---

**הערה חשובה**: זהו מנוע סימולציה למטרות הדגמה בלבד. לשימוש פיננסי אמיתי יש להתייעץ עם יועץ פיננסי מוסמך.
