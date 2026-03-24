import { describe, expect, it } from 'vitest';

import { parseSuggestedNumber } from './parseSuggestedNumber';

describe('parseSuggestedNumber', () => {
  it('uses range average when range exists', () => {
    expect(parseSuggestedNumber('Рыночный диапазон 50 000-70 000 руб.')).toBe(60000);
  });

  it('falls back to first positive number', () => {
    expect(parseSuggestedNumber('Можно поставить 42 000 ₽')).toBe(42000);
  });

  it('returns null when number is absent', () => {
    expect(parseSuggestedNumber('Не удалось оценить')).toBeNull();
  });
});
