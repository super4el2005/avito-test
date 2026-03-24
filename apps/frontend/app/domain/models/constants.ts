import { ITEM_CATEGORIES } from '@ads/shared';

import type { Category, SortFormValue } from './types';

export const LIMIT_ADS = 10;

export const AI_REQUEST_ERROR_MESSAGE =
  'Произошла ошибка при запросе к AI\nПопробуйте повторить запрос или закройте уведомление';

export const CATEGORIES_TRANSLATE: Record<Category, string> = {
  [ITEM_CATEGORIES.AUTO]: 'Автомобили',
  [ITEM_CATEGORIES.REAL_ESTATE]: 'Недвижимость',
  [ITEM_CATEGORIES.ELECTRONICS]: 'Электроника',
};

export const CATEGORIES_FORM: { value: Category; label: string }[] = [
  { value: ITEM_CATEGORIES.AUTO, label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.AUTO] },
  { value: ITEM_CATEGORIES.REAL_ESTATE, label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.REAL_ESTATE] },
  { value: ITEM_CATEGORIES.ELECTRONICS, label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.ELECTRONICS] },
];

export const SORT_FORM: {
  value: SortFormValue;
  label: string;
}[] = [
  { value: 'createdAt:desc', label: 'По новизне (сначала новые)' },
  { value: 'createdAt:asc', label: 'По новизне (сначала старые)' },
  { value: 'price:asc', label: 'По цене (сначала дешевле)' },
  { value: 'price:desc', label: 'По цене (сначала дороже)' },
  { value: 'title:asc', label: 'По названию (А → Я)' },
  { value: 'title:desc', label: 'По названию (Я → А)' },
];

export const AUTO_TRANSMISSION_OPTIONS = [
  { value: 'automatic', label: 'Автомат' },
  { value: 'manual', label: 'Механика' },
];

export const REAL_ESTATE_TYPE_OPTIONS = [
  { value: 'flat', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'room', label: 'Комната' },
];

export const ELECTRONICS_TYPE_OPTIONS = [
  { value: 'phone', label: 'Телефон' },
  { value: 'laptop', label: 'Ноутбук' },
  { value: 'misc', label: 'Разное' },
];

export const ELECTRONICS_CONDITION_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'used', label: 'Б/У' },
];

const PARAM_LABEL_TRANSLATIONS: Record<string, string> = {
  brand: 'Марка',
  model: 'Модель',
  yearOfManufacture: 'Год выпуска',
  transmission: 'Коробка передач',
  mileage: 'Пробег (км)',
  enginePower: 'Мощность двигателя (л.с.)',
  type: 'Тип',
  address: 'Адрес',
  area: 'Площадь (м²)',
  floor: 'Этаж',
  condition: 'Состояние',
  color: 'Цвет',
};

const PARAM_VALUE_TRANSLATIONS: Record<string, string> = {
  automatic: 'Автомат',
  manual: 'Механика',
  new: 'Новый',
  used: 'Б/У',
};

const TYPE_VALUE_TRANSLATIONS_BY_CATEGORY: Record<string, Record<string, string>> = {
  [ITEM_CATEGORIES.REAL_ESTATE]: {
    flat: 'Квартира',
    house: 'Дом',
    room: 'Комната',
  },
  [ITEM_CATEGORIES.ELECTRONICS]: {
    phone: 'Телефон',
    laptop: 'Ноутбук',
    misc: 'Разное',
  },
};

const TYPE_LABEL_TRANSLATIONS_BY_CATEGORY: Record<string, string> = {
  [ITEM_CATEGORIES.REAL_ESTATE]: 'Тип недвижимости',
  [ITEM_CATEGORIES.ELECTRONICS]: 'Тип',
};

const DATE_TIME_FORMATTER_RU = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function getAdsPlural(n: number) {
  const forms = ['объявление', 'объявления', 'объявлений'];
  const num = Math.abs(n) % 100;
  const n1 = num % 10;
  if (num > 10 && num < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

export function formatDateTimeRu(value?: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const parts = DATE_TIME_FORMATTER_RU.formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  if (!day || !month || !hour || !minute) return '-';
  return `${day} ${month} ${hour}:${minute}`;
}

export function translateParamLabel(key: string, category?: string): string {
  if (key === 'type' && category) {
    return TYPE_LABEL_TRANSLATIONS_BY_CATEGORY[category] ?? PARAM_LABEL_TRANSLATIONS.type;
  }

  return PARAM_LABEL_TRANSLATIONS[key] ?? key;
}

export function translateParamValue(key: string, value: unknown, category?: string): string {
  const valueKey = String(value);

  if (key === 'type' && category) {
    return TYPE_VALUE_TRANSLATIONS_BY_CATEGORY[category]?.[valueKey] ?? valueKey;
  }

  return PARAM_VALUE_TRANSLATIONS[valueKey] ?? valueKey;
}

export function isKnownParamLabel(key: string): boolean {
  return Boolean(PARAM_LABEL_TRANSLATIONS[key]);
}
