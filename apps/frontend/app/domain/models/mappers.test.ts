import { describe, expect, it } from 'vitest';

import { buildAdDetailsParamsViewModel } from './selectors';
import { mapItemDetailsToEditFormValues } from './mappers';

describe('domain mappers', () => {
  it('maps item details to edit form values preserving category params', () => {
    const result = mapItemDetailsToEditFormValues({
      id: 1,
      category: 'electronics',
      title: 'Ноутбук',
      price: 1000,
      description: 'Описание',
      params: { brand: 'Lenovo', model: 'T14' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      needsRevision: false,
      missingParams: [],
    });

    expect(result).toEqual({
      category: 'electronics',
      title: 'Ноутбук',
      price: 1000,
      description: 'Описание',
      params: { brand: 'Lenovo', model: 'T14' },
    });
  });

  it('builds ad details params view model with translated missing params fallback', () => {
    const result = buildAdDetailsParamsViewModel({
      id: 2,
      category: 'real_estate',
      title: 'Квартира',
      price: 5000000,
      description: '',
      params: { floor: 4 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      needsRevision: true,
      missingParams: [],
    });

    expect(result.hasParams).toBe(true);
    expect(result.translatedParams).toEqual([{ key: 'floor', value: 4 }]);
    expect(result.missingParamLabels).toEqual(['Не заполнено описание']);
  });
});
