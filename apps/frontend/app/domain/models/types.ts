import { type Item, ITEM_CATEGORIES, type ItemSortColumn, type SortDirection } from '@ads/shared';

export type Category = (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];

export type AdResponse = Item & { needsRevision: boolean };

export type AdsResponse = {
  total: number;
  items: AdResponse[];
};

export type ItemDetailsResponse = Item & {
  needsRevision: boolean;
  missingParams: string[];
};

export type ItemEditFormValues =
  | {
      category: 'auto';
      title: string;
      price: number | null;
      description: string;
      params: Record<string, unknown>;
    }
  | {
      category: 'real_estate';
      title: string;
      price: number | null;
      description: string;
      params: Record<string, unknown>;
    }
  | {
      category: 'electronics';
      title: string;
      price: number | null;
      description: string;
      params: Record<string, unknown>;
    };

export type SortFormValue = `${ItemSortColumn}:${SortDirection}`;

export type ParamsAuto = NonNullable<Extract<Item, { category: 'auto' }>['params']>;
export type ParamsRealEstate = NonNullable<Extract<Item, { category: 'real_estate' }>['params']>;
export type ParamsElectronics = NonNullable<Extract<Item, { category: 'electronics' }>['params']>;
