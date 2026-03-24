import { describe, expect, it } from 'vitest';

import { extractAverageFromNumberRange, extractFirstPositiveNumber } from './extract-first-positive-number';

describe('extractFirstPositiveNumber', () => {
  it('extracts first positive number from text', () => {
    expect(extractFirstPositiveNumber('Цена около 12 500 рублей')).toBe(12500);
  });

  it('returns null when no positive numbers', () => {
    expect(extractFirstPositiveNumber('Цена не указана')).toBeNull();
  });
});

describe('extractAverageFromNumberRange', () => {
  it('extracts average from numeric range', () => {
    expect(extractAverageFromNumberRange('Диапазон 100 000 - 200 000 ₽')).toBe(150000);
  });

  it('returns null when no range found', () => {
    expect(extractAverageFromNumberRange('Примерно 90 000 ₽')).toBeNull();
  });
});
