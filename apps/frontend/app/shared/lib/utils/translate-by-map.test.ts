import { describe, expect, it } from 'vitest';

import { translateByMap } from './translate-by-map';

describe('translateByMap', () => {
  it('returns translated value when key exists', () => {
    expect(translateByMap('auto', { auto: 'Автомобили' })).toBe('Автомобили');
  });

  it('returns key when translation is missing', () => {
    expect(translateByMap('unknown', { auto: 'Автомобили' })).toBe('unknown');
  });
});
