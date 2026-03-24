import { extractAverageFromNumberRange, extractFirstPositiveNumber } from './extractFirstPositiveNumber';

export const parseSuggestedNumber = (text: string): number | null => {
  const rangeAverage = extractAverageFromNumberRange(text);
  if (rangeAverage !== null) return rangeAverage;
  return extractFirstPositiveNumber(text);
};
