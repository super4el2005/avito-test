export const extractFirstPositiveNumber = (text: string): number | null => {
  const normalized = text.replace(/\u00A0/g, ' ');
  const match = normalized.match(/(\d[\d\s]{1,9})/);
  if (!match) return null;

  const value = Number(match[1].replace(/\s/g, ''));
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

export const extractAverageFromNumberRange = (text: string): number | null => {
  const normalized = text.replace(/\u00A0/g, ' ');
  const rangeMatch = normalized.match(/(\d[\d\s]{1,9})\s*(?:-|–|—)\s*(\d[\d\s]{1,9})/i);
  if (!rangeMatch) return null;

  const left = Number(rangeMatch[1].replace(/\s/g, ''));
  const right = Number(rangeMatch[2].replace(/\s/g, ''));
  if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) {
    return null;
  }

  return Math.round((left + right) / 2);
};
