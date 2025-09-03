import { simulate, defaultParams, runMultipleSimulations } from './src';

console.log('🚀 מנוע הסימולציה של הגמ"ח המרכזי\n');

// דוגמה בסיסית
console.log('📊 דוגמה בסיסית:');
const basicResults = simulate({
  ...defaultParams,
  intake: { newPerYear: 500, years: 10 },
  savings: { monthly: 80, months: 120 },
  early: { 
    ...defaultParams.early, 
    enabled: true,
    minCashReserve: 15000
  }
});

console.log('מדדי ביצוע:');
console.log(`- אחוז הלוואות מוקדמות: ${basicResults.kpis.percentEarly.toFixed(1)}%`);
console.log(`- סך הלוואות מוקדמות: ${basicResults.kpis.totalEarly}`);
console.log(`- סך הלוואות רגילות: ${basicResults.kpis.totalStd}`);
console.log(`- יתרה מינימלית: ${basicResults.kpis.minCash.toLocaleString('he-IL')} ₪`);
console.log(`- יתרה סופית: ${basicResults.kpis.endCash.toLocaleString('he-IL')} ₪`);
console.log(`- חודשים עם יתרה שלילית: ${basicResults.kpis.negativeCashMonths}`);

// השוואת תרחישים
console.log('\n🔄 השוואת תרחישים:');
const scenarios = runMultipleSimulations(defaultParams, [
  { 
    early: { ...defaultParams.early, enabled: false },
    intake: { newPerYear: 300, years: 15 }
  },
  { 
    early: { ...defaultParams.early, enabled: true, minCashReserve: 5000 },
    intake: { newPerYear: 300, years: 15 }
  },
  { 
    early: { ...defaultParams.early, enabled: true, minCashReserve: 50000 },
    intake: { newPerYear: 300, years: 15 }
  }
]);

scenarios.forEach((result, index) => {
  const scenario = ['ללא מוקדמות', 'כרית נמוכה', 'כרית גבוהה'][index];
  console.log(`${scenario}: ${result.kpis.percentEarly.toFixed(1)}% מוקדמות, יתרה סופית: ${result.kpis.endCash.toLocaleString('he-IL')} ₪`);
});

console.log('\n✅ המנוע עובד בהצלחה!');
