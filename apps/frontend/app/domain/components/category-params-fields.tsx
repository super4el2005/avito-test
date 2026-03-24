import { ActionIcon, NumberInput, Select, Stack, TextInput } from '@mantine/core';

import { memo } from 'react';

import { MdOutlineClear } from 'react-icons/md';

import { ITEM_CATEGORIES } from '@ads/shared';

import {
  AUTO_TRANSMISSION_OPTIONS,
  ELECTRONICS_CONDITION_OPTIONS,
  ELECTRONICS_TYPE_OPTIONS,
  REAL_ESTATE_TYPE_OPTIONS,
} from '../models/constants';
import type { Category, ItemEditFormValues, ParamsAuto, ParamsElectronics, ParamsRealEstate } from '../models/types';

export type WarningInputStyles = {
  input: {
    borderColor: string;
  };
};

export type MaybeWarnIfEmpty = (isRequired: boolean, value: unknown) => WarningInputStyles | undefined;

type CategoryParamsProps<TParams> = {
  params: TParams;
  setParams: (next: TParams) => void;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
};

export type CategoryParamsFieldsProps = {
  category: Category;
  params: ItemEditFormValues['params'];
  setParams: (next: ItemEditFormValues['params']) => void;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
};

function patchParams<TParams extends object>(base: TParams, patch: Partial<TParams>): TParams {
  return { ...base, ...patch };
}

function toOptionalNumber(value: string | number) {
  return typeof value === 'number' ? value : undefined;
}

type ClearableTextInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
  styles?: WarningInputStyles;
};

const ClearableTextInput = memo(function ClearableTextInput({
  label,
  placeholder,
  value,
  onChange,
  onClear,
  styles,
}: ClearableTextInputProps) {
  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      rightSection={
        value ? (
          <ActionIcon variant="subtle" color="gray" aria-label="Очистить" onClick={onClear}>
            <MdOutlineClear size={18} />
          </ActionIcon>
        ) : null
      }
      styles={styles}
    />
  );
});

function ParamsClearableText<TParams extends object>({
  label,
  placeholder,
  params,
  setParams,
  field,
  maybeWarnIfEmpty,
}: {
  label: string;
  placeholder: string;
  params: TParams;
  setParams: (next: TParams) => void;
  field: keyof TParams;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
}) {
  const v = params[field];
  const str = typeof v === 'string' ? v : '';
  return (
    <ClearableTextInput
      label={label}
      placeholder={placeholder}
      value={str}
      onChange={(nextValue) => setParams(patchParams(params, { [field]: nextValue || undefined } as Partial<TParams>))}
      onClear={() => setParams(patchParams(params, { [field]: undefined } as Partial<TParams>))}
      styles={maybeWarnIfEmpty(false, v)}
    />
  );
}

function ParamsOptionalSelect<TParams extends object>({
  label,
  data,
  params,
  setParams,
  field,
  maybeWarnIfEmpty,
}: {
  label: string;
  data: { value: string; label: string }[];
  params: TParams;
  setParams: (next: TParams) => void;
  field: keyof TParams;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
}) {
  const raw = params[field];
  return (
    <Select
      label={label}
      placeholder="Выберите"
      clearable
      data={data}
      value={raw != null && raw !== '' ? String(raw as string) : null}
      onChange={(value) =>
        setParams(patchParams(params, { [field]: (value ?? undefined) as TParams[keyof TParams] } as Partial<TParams>))
      }
      styles={maybeWarnIfEmpty(false, raw)}
    />
  );
}

function ParamsOptionalNumber<TParams extends object>({
  label,
  placeholder,
  min,
  params,
  setParams,
  field,
  maybeWarnIfEmpty,
}: {
  label: string;
  placeholder: string;
  min?: number;
  params: TParams;
  setParams: (next: TParams) => void;
  field: keyof TParams;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
}) {
  const v = params[field];
  return (
    <NumberInput
      label={label}
      placeholder={placeholder}
      hideControls
      min={min}
      value={typeof v === 'number' ? v : undefined}
      onChange={(value) =>
        setParams(patchParams(params, { [field]: toOptionalNumber(value) as TParams[keyof TParams] } as Partial<TParams>))
      }
      styles={maybeWarnIfEmpty(false, v)}
    />
  );
}

const AutoParamsFields = memo(function AutoParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps<ParamsAuto>) {
  const p = params;

  return (
    <Stack gap="sm">
      <ParamsOptionalSelect
        label="Коробка передач"
        data={AUTO_TRANSMISSION_OPTIONS}
        params={p}
        setParams={setParams}
        field="transmission"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Марка"
        placeholder="Марка"
        params={p}
        setParams={setParams}
        field="brand"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Модель"
        placeholder="Модель"
        params={p}
        setParams={setParams}
        field="model"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalNumber
        label="Год выпуска"
        placeholder="Год"
        min={1900}
        params={p}
        setParams={setParams}
        field="yearOfManufacture"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalNumber
        label="Пробег (км)"
        placeholder="Пробег"
        min={0}
        params={p}
        setParams={setParams}
        field="mileage"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalNumber
        label="Мощность двигателя (л.с.)"
        placeholder="Мощность"
        min={0}
        params={p}
        setParams={setParams}
        field="enginePower"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
    </Stack>
  );
});

const RealEstateParamsFields = memo(function RealEstateParamsFields({
  params,
  setParams,
  maybeWarnIfEmpty,
}: CategoryParamsProps<ParamsRealEstate>) {
  const p = params;

  return (
    <Stack gap="sm">
      <ParamsOptionalSelect
        label="Тип"
        data={REAL_ESTATE_TYPE_OPTIONS}
        params={p}
        setParams={setParams}
        field="type"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Адрес"
        placeholder="Адрес"
        params={p}
        setParams={setParams}
        field="address"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalNumber
        label="Площадь (м²)"
        placeholder="Площадь"
        min={0}
        params={p}
        setParams={setParams}
        field="area"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalNumber
        label="Этаж"
        placeholder="Этаж"
        min={0}
        params={p}
        setParams={setParams}
        field="floor"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
    </Stack>
  );
});

const ElectronicsParamsFields = memo(function ElectronicsParamsFields({
  params,
  setParams,
  maybeWarnIfEmpty,
}: CategoryParamsProps<ParamsElectronics>) {
  const p = params;

  return (
    <Stack gap="sm">
      <ParamsOptionalSelect
        label="Тип"
        data={ELECTRONICS_TYPE_OPTIONS}
        params={p}
        setParams={setParams}
        field="type"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Бренд"
        placeholder="Бренд"
        params={p}
        setParams={setParams}
        field="brand"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Модель"
        placeholder="Модель"
        params={p}
        setParams={setParams}
        field="model"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsOptionalSelect
        label="Состояние"
        data={ELECTRONICS_CONDITION_OPTIONS}
        params={p}
        setParams={setParams}
        field="condition"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
      <ParamsClearableText
        label="Цвет"
        placeholder="Цвет"
        params={p}
        setParams={setParams}
        field="color"
        maybeWarnIfEmpty={maybeWarnIfEmpty}
      />
    </Stack>
  );
});

export const CategoryParamsFields = memo(function CategoryParamsFields({
  category,
  params,
  setParams,
  maybeWarnIfEmpty,
}: CategoryParamsFieldsProps) {
  if (category === ITEM_CATEGORIES.AUTO) {
    return <AutoParamsFields params={params as ParamsAuto} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
  }
  if (category === ITEM_CATEGORIES.REAL_ESTATE) {
    return <RealEstateParamsFields params={params as ParamsRealEstate} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
  }
  return <ElectronicsParamsFields params={params as ParamsElectronics} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
});
