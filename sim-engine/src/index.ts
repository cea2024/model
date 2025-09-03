/**
 * @gemach/sim-engine
 * מנוע סימולציה כלכלי עבור הגמ"ח המרכזי
 */

// ייצוא טיפוסים
export * from './types';

// ייצוא פרמטרים וולידציה
export { defaultParams, validateParams } from './params';

// ייצוא המנוע הראשי
export { simulate, runMultipleSimulations, compareResults } from './engine';

// ייצוא פונקציות אנליטיקה
export { buildYearlyData, calculateKpis, calculateExtendedStats } from './analytics';

// ייצוא פונקציות עזר
export * from './utils';
export * from './scheduler';
export * from './opex';

// גרסה
export const VERSION = '1.0.0';
