import type { ItemDetailsResponse, ItemEditFormValues } from './types';

export function mapItemDetailsToEditFormValues(item: ItemDetailsResponse): ItemEditFormValues {
  if (item.category === 'auto') {
    return {
      category: 'auto',
      title: item.title ?? '',
      price: item.price ?? null,
      description: item.description ?? '',
      params: (item.params ?? {}) as ItemEditFormValues['params'],
    };
  }

  if (item.category === 'real_estate') {
    return {
      category: 'real_estate',
      title: item.title ?? '',
      price: item.price ?? null,
      description: item.description ?? '',
      params: (item.params ?? {}) as ItemEditFormValues['params'],
    };
  }

  return {
    category: 'electronics',
    title: item.title ?? '',
    price: item.price ?? null,
    description: item.description ?? '',
    params: (item.params ?? {}) as ItemEditFormValues['params'],
  };
}
