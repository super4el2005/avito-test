import type { ItemDetailsResponse, ItemEditFormValues } from './types';

type BaseEditFields = Pick<ItemEditFormValues, 'title' | 'price' | 'description'>;

function mapBaseEditFields(item: ItemDetailsResponse): BaseEditFields {
  return {
    title: item.title ?? '',
    price: item.price ?? null,
    description: item.description ?? '',
  };
}

export function mapItemDetailsToEditFormValues(item: ItemDetailsResponse): ItemEditFormValues {
  const base = mapBaseEditFields(item);

  if (item.category === 'auto') {
    return {
      category: 'auto',
      ...base,
      params: item.params ?? {},
    };
  }

  if (item.category === 'real_estate') {
    return {
      category: 'real_estate',
      ...base,
      params: item.params ?? {},
    };
  }

  return {
    category: 'electronics',
    ...base,
    params: item.params ?? {},
  };
}
