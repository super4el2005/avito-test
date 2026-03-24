import { isKnownParamLabel, translateParamLabel } from './constants';
import type { ItemDetailsResponse } from './types';

type TranslatedParamsEntry = {
  key: string;
  value: unknown;
};

type AdDetailsParamsViewModel = {
  hasParams: boolean;
  translatedParams: TranslatedParamsEntry[];
  missingParamLabels: string[];
};

export function buildAdDetailsParamsViewModel(ad?: ItemDetailsResponse): AdDetailsParamsViewModel {
  const adParams = ad?.params ?? {};
  const translatedParams = Object.entries(adParams)
    .filter(([key]) => key === 'type' || isKnownParamLabel(key))
    .map(([key, value]) => ({ key, value }));

  const missingParamLabels = ad?.missingParams.length
    ? ad.missingParams.map((param) => translateParamLabel(param, ad?.category))
    : ['Не заполнено описание'];

  return {
    hasParams: translatedParams.length > 0,
    translatedParams,
    missingParamLabels,
  };
}
