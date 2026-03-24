import { extractAverageFromNumberRange, extractFirstPositiveNumber } from './extract-first-positive-number';

export function parseSuggestedNumber(text: string): number | null {
  const rangeAverage = extractAverageFromNumberRange(text);
  if (rangeAverage !== null) return rangeAverage;
  return extractFirstPositiveNumber(text);
}
