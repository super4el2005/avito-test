import type { ItemDetailsResponse, ItemEditFormValues } from './types';

export function mapItemDetailsToEditFormValues(item: ItemDetailsResponse): ItemEditFormValues {
  return {
    category: item.category,
    title: item.title ?? '',
    price: item.price ?? null,
    description: item.description ?? '',
    params: item.params ?? {},
  } as ItemEditFormValues;
}
