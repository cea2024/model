# מודל גמ"ח - דשבורד ניתוח וסימולציה

פרויקט מקיף לדמיה וניתוח של מודל הגמ"ח (גמילות חסדים) הכולל ממשק משתמש מתקדם ומנוע סימולציה כלכלי.

## מבנה הפרויקט

```
├── gemach-ui/          # ממשק משתמש (Next.js + TypeScript)
├── sim-engine/         # מנוע סימולציה כלכלי (TypeScript)
├── package.json        # מונורפו root
└── README.md          # מדריך זה
```

## התחלה מהירה

### התקנה
```bash
npm install
```

### הפעלת ממשק המשתמש
```bash
npm run dev
```
האפליקציה תהיה זמינה ב-http://localhost:3000

### הפעלת בדיקות
```bash
npm test
```

## תכונות עיקריות

### ממשק המשתמש (gemach-ui)
- **דשבורד RTL** בעברית עם פונט Heebo
- **6 כרטיסי KPI** עם מדדי ביצוע
- **גרפים אינטראקטיביים** עם Recharts
- **פאנל פרמטרים** מלא עם tooltips
- **טבלאות מפורטות** עם פגינציה
- **בקרת טווח תצוגה** לגרפים

### מנוע הסימולציה (sim-engine)
- **סימולציה דטרמיניסטית** ל-30+ שנים
- **אלגוריתם הלוואות מוקדמות** גרידי
- **3 מצבי OPEX** (UPFRONT/MONTHLY/ON_LOAN)
- **תשואה על יתרה** אופציונלית
- **20 בדיקות מקיפות** עם Vitest
- **API מלא** לסימולציות מרובות

## פרמטרי המודל

### מצטרפים חדשים
- מספר מצטרפים בשנה
- אופק הסימולציה

### חיסכון
- תרומה חודשית (₪)
- מספר חודשי חיסכון

### הלוואה רגילה
- סכום ההלוואה (₪)
- תקופת המתנה (חודשים)
- החזר חודשי (₪)
- מספר חודשי החזר
- מחילת זנב (חודשים)

### הלוואה מוקדמת
- הפעלה/כיבוי
- מספר חודשי החזר
- כרית מזומנים מינימלית
- מגבלת הלוואות לחודש

### הוצאות תפעול
- מצב עיתוי (UPFRONT/MONTHLY/ON_LOAN)
- עלות ליחידה (₪)
- אחוז מ-4,800₪

### תשואה
- שיעור תשואה שנתי
- החלה רק על יתרה חיובית

## טכנולוגיות

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: TypeScript, Vitest
- **כלים**: ESLint, Prettier, Git

## פיתוח

### מבנה קבצים
```
gemach-ui/src/
├── app/
│   ├── layout.tsx         # RTL + Heebo font
│   └── page.tsx           # דף בית
├── components/
│   ├── ParamsPanel.tsx    # פאנל פרמטרים
│   ├── KpiCards.tsx       # כרטיסי KPI
│   ├── Charts.tsx         # גרפים
│   └── YearlyTable.tsx    # טבלאות
└── lib/
    ├── types.ts           # טיפוסים
    ├── useSimulation.ts   # הוק סימולציה
    └── ui-helpers.ts      # פונקציות עזר

sim-engine/src/
├── types.ts              # טיפוסים
├── params.ts             # פרמטרי ברירת מחדל
├── engine.ts             # מנוע הסימולציה
├── scheduler.ts          # תזמון החזרים
├── opex.ts               # הוצאות תפעול
├── analytics.ts          # אנליטיקה
├── utils.ts              # פונקציות עזר
└── index.ts              # API ייצוא
```

### הרצת בדיקות
```bash
# בדיקות מנוע הסימולציה
cd sim-engine && npm test

# בנייה
npm run build
```

## דוגמת שימוש

```typescript
import { simulate, defaultParams } from '@gemach/sim-engine';

const results = simulate({
  ...defaultParams,
  intake: { newPerYear: 1000, years: 30 },
  early: { 
    ...defaultParams.early, 
    enabled: true,
    minCashReserve: 20000
  }
});

console.log('אחוז מוקדמות:', results.kpis.percentEarly);
console.log('יתרה סופית:', results.kpis.endCash);
```

## תרחישי בדיקה

### ללא הלוואות מוקדמות
- כבה `early.enabled`
- רואים פיק גדול בהלוואות בשנה 20-21

### עם הלוואות מוקדמות
- הפעל `early.enabled` עם כרית 20,000₪
- רואים התפלגות חלקה יותר

### השפעת OPEX
- נסה `MONTHLY` עם `percentOf4800=0.01`
- רואים ירידה עדינה ביתרה

## הערות חשובות

⚠️ **זוהי דמיה למטרות הדגמה בלבד**
הנתונים המוצגים הם תוצר של מודל מתמטי ואינם מייצגים מודל פיננסי אמיתי. לשימוש פיננסי אמיתי יש להתייעץ עם יועץ פיננסי מוסמך.

## רישיון

MIT License

## תרומה

ברוכים הבאים לתרום לפרויקט! אנא פתחו Issues או Pull Requests.
