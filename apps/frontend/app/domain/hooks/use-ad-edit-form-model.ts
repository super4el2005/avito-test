import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { useCallback, useMemo, useRef } from 'react';

import { useNavigate } from 'react-router';

import { ITEM_CATEGORIES, ItemUpdateInSchema } from '@ads/shared';

import type { MaybeWarnIfEmpty, WarningInputStyles } from '../components/category-params-fields';
import { CATEGORIES_TRANSLATE } from '../models/constants';
import { mapItemDetailsToEditFormValues } from '../models/mappers';
import type { Category, ItemDetailsResponse, ItemEditFormValues, ParamsAuto, ParamsElectronics, ParamsRealEstate } from '../models/types';

import { apiAds } from '~/api';
import { queryClient } from '~/root';
import { extractErrorMessage } from '~/shared';

type UseAdEditFormModelParams = {
  id: string;
  item: ItemDetailsResponse;
  warningStyles: WarningInputStyles;
};

type UseAdEditFormModelResult = Readonly<{
  form: ReturnType<typeof useForm<ItemEditFormValues>>;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
  setCategoryParams: (next: ItemEditFormValues['params']) => void;
  categoryOptions: ReadonlyArray<{ value: Category; label: string }>;
  updateAdMutation: UseMutationResult<{ data: unknown }, Error, ItemEditFormValues, unknown>;
  requiredOk: boolean;
  onCategoryChange: (value: string | null) => void;
}>;

type ParamsByCategory = {
  [ITEM_CATEGORIES.AUTO]: ParamsAuto;
  [ITEM_CATEGORIES.REAL_ESTATE]: ParamsRealEstate;
  [ITEM_CATEGORIES.ELECTRONICS]: ParamsElectronics;
};

function getEmptyParamsByCategory(): ParamsByCategory {
  return {
    [ITEM_CATEGORIES.AUTO]: {},
    [ITEM_CATEGORIES.REAL_ESTATE]: {},
    [ITEM_CATEGORIES.ELECTRONICS]: {},
  };
}

function parseCategory(value: string | null): Category {
  if (value && Object.values(ITEM_CATEGORIES).includes(value as Category)) {
    return value as Category;
  }
  return ITEM_CATEGORIES.ELECTRONICS;
}

function storeParamsForCategory(
  bucket: ParamsByCategory,
  category: Category,
  params: ItemEditFormValues['params'],
) {
  switch (category) {
    case ITEM_CATEGORIES.AUTO:
      bucket[ITEM_CATEGORIES.AUTO] = params as ParamsAuto;
      break;
    case ITEM_CATEGORIES.REAL_ESTATE:
      bucket[ITEM_CATEGORIES.REAL_ESTATE] = params as ParamsRealEstate;
      break;
    default:
      bucket[ITEM_CATEGORIES.ELECTRONICS] = params as ParamsElectronics;
  }
}

export function useAdEditFormModel({ id, item, warningStyles }: UseAdEditFormModelParams) {
  const navigate = useNavigate();

  const form = useForm<ItemEditFormValues>({
    initialValues: mapItemDetailsToEditFormValues(item),
    validateInputOnBlur: true,
    validate: (values: ItemEditFormValues) => ({
      category: !values.category ? 'Категория должна быть заполнена' : null,
      title: !values.title.trim() ? 'Название должно быть заполнено' : null,
      price: values.price === null ? 'Цена должна быть заполнена' : null,
    }),
  });

  const paramsByCategoryRef = useRef<ParamsByCategory>({
    ...getEmptyParamsByCategory(),
    [ITEM_CATEGORIES.AUTO]: item.category === ITEM_CATEGORIES.AUTO ? item.params ?? {} : {},
    [ITEM_CATEGORIES.REAL_ESTATE]: item.category === ITEM_CATEGORIES.REAL_ESTATE ? item.params ?? {} : {},
    [ITEM_CATEGORIES.ELECTRONICS]: item.category === ITEM_CATEGORIES.ELECTRONICS ? item.params ?? {} : {},
  });

  const maybeWarnIfEmpty = useCallback(
    (isRequired: boolean, value: unknown) => {
      if (isRequired) return undefined;
      const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      return isEmpty ? warningStyles : undefined;
    },
    [warningStyles],
  );

  const setCategoryParams = useCallback(
    (next: ItemEditFormValues['params']) => {
      storeParamsForCategory(paramsByCategoryRef.current, form.values.category, next);
      form.setFieldValue('params', next);
    },
    [form.setFieldValue, form.values.category],
  );

  const categoryOptions = useMemo(
    () =>
      (Object.values(ITEM_CATEGORIES) as Category[]).map((value) => ({
        value,
        label: CATEGORIES_TRANSLATE[value],
      })),
    [],
  );

  const updateAdMutation = useMutation({
    mutationFn: async (values: ItemEditFormValues) => {
      if (values.price === null) {
        throw new Error('Цена должна быть заполнена');
      }
      const payload = {
        category: values.category,
        title: values.title.trim(),
        price: values.price,
        description: values.description?.trim() ? values.description.trim() : undefined,
        params: values.params ?? {},
      };
      const parsedPayload = ItemUpdateInSchema.safeParse(payload);

      if (!parsedPayload.success) {
        throw new Error('Данные формы не прошли валидацию перед сохранением');
      }

      return apiAds.put(`/items/${id}`, parsedPayload.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ads'] });
      await queryClient.invalidateQueries({ queryKey: ['ad', id] });

      notifications.show({
        position: 'top-right',
        title: 'Изменения сохранены',
        message: '',
        color: 'green',
      });
      navigate(`/ads/${id}`);
    },
    onError: (error) => {
      notifications.show({
        position: 'top-right',
        title: 'Ошибка сохранения',
        message: extractErrorMessage(error, 'При попытке сохранить изменения произошла ошибка. Попробуйте ещё раз или зайдите позже.'),
        color: 'red',
      });
    },
  });

  const requiredOk = Boolean(form.values.category) && Boolean(form.values.title.trim()) && form.values.price !== null;

  const onCategoryChange = useCallback(
    (value: string | null) => {
      const nextCategory = parseCategory(value);
      const currentValues = form.values;

      storeParamsForCategory(paramsByCategoryRef.current, currentValues.category, currentValues.params);

      const nextParams = paramsByCategoryRef.current[nextCategory];

      form.setFieldValue('category', nextCategory);
      form.setFieldValue('params', nextParams);

      form.setDirty({
        category: true,
        params: true,
      });
    },
    [form],
  );

  return {
    form,
    maybeWarnIfEmpty,
    setCategoryParams,
    categoryOptions,
    updateAdMutation,
    requiredOk,
    onCategoryChange,
  } satisfies UseAdEditFormModelResult;
}
