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

type CategoryParamsProps = {
  params: ItemEditFormValues['params'];
  setParams: (next: ItemEditFormValues['params']) => void;
  maybeWarnIfEmpty: (isRequired: boolean, value: unknown) => WarningInputStyles | undefined;
};

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

const AutoParamsFields = memo(function AutoParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  const autoParams = params as Partial<ParamsAuto>;

  return (
    <Stack gap="sm">
      <Select
        label="Коробка передач"
        placeholder="Выберите"
        clearable
        data={AUTO_TRANSMISSION_OPTIONS}
        value={autoParams.transmission ?? null}
        onChange={(value) =>
          setParams({
            ...autoParams,
            transmission: (value ?? undefined) as ParamsAuto['transmission'] | undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, autoParams.transmission)}
      />
      <ClearableTextInput
        label="Марка"
        placeholder="Марка"
        value={autoParams.brand ?? ''}
        onChange={(nextValue) => setParams({ ...autoParams, brand: nextValue || undefined })}
        onClear={() => setParams({ ...autoParams, brand: undefined })}
        styles={maybeWarnIfEmpty(false, autoParams.brand)}
      />
      <ClearableTextInput
        label="Модель"
        placeholder="Модель"
        value={autoParams.model ?? ''}
        onChange={(nextValue) => setParams({ ...autoParams, model: nextValue || undefined })}
        onClear={() => setParams({ ...autoParams, model: undefined })}
        styles={maybeWarnIfEmpty(false, autoParams.model)}
      />
      <NumberInput
        label="Год выпуска"
        placeholder="Год"
        hideControls
        min={1900}
        value={autoParams.yearOfManufacture ?? undefined}
        onChange={(value) =>
          setParams({
            ...autoParams,
            yearOfManufacture: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, autoParams.yearOfManufacture)}
      />
      <NumberInput
        label="Пробег (км)"
        placeholder="Пробег"
        hideControls
        min={0}
        value={autoParams.mileage ?? undefined}
        onChange={(value) =>
          setParams({
            ...autoParams,
            mileage: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, autoParams.mileage)}
      />
      <NumberInput
        label="Мощность двигателя (л.с.)"
        placeholder="Мощность"
        hideControls
        min={0}
        value={autoParams.enginePower ?? undefined}
        onChange={(value) =>
          setParams({
            ...autoParams,
            enginePower: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, autoParams.enginePower)}
      />
    </Stack>
  );
});

const RealEstateParamsFields = memo(function RealEstateParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  const realEstateParams = params as Partial<ParamsRealEstate>;

  return (
    <Stack gap="sm">
      <Select
        label="Тип"
        placeholder="Выберите"
        clearable
        data={REAL_ESTATE_TYPE_OPTIONS}
        value={realEstateParams.type ?? null}
        onChange={(value) =>
          setParams({
            ...realEstateParams,
            type: (value ?? undefined) as ParamsRealEstate['type'] | undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, realEstateParams.type)}
      />
      <ClearableTextInput
        label="Адрес"
        placeholder="Адрес"
        value={realEstateParams.address ?? ''}
        onChange={(nextValue) => setParams({ ...realEstateParams, address: nextValue || undefined })}
        onClear={() => setParams({ ...realEstateParams, address: undefined })}
        styles={maybeWarnIfEmpty(false, realEstateParams.address)}
      />
      <NumberInput
        label="Площадь (м²)"
        placeholder="Площадь"
        hideControls
        min={0}
        value={realEstateParams.area ?? undefined}
        onChange={(value) =>
          setParams({
            ...realEstateParams,
            area: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, realEstateParams.area)}
      />
      <NumberInput
        label="Этаж"
        placeholder="Этаж"
        hideControls
        min={0}
        value={realEstateParams.floor ?? undefined}
        onChange={(value) =>
          setParams({
            ...realEstateParams,
            floor: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, realEstateParams.floor)}
      />
    </Stack>
  );
});

const ElectronicsParamsFields = memo(function ElectronicsParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  const electronicsParams = params as Partial<ParamsElectronics>;

  return (
    <Stack gap="sm">
      <Select
        label="Тип"
        placeholder="Выберите"
        clearable
        data={ELECTRONICS_TYPE_OPTIONS}
        value={electronicsParams.type ?? null}
        onChange={(value) =>
          setParams({
            ...electronicsParams,
            type: (value ?? undefined) as ParamsElectronics['type'] | undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, electronicsParams.type)}
      />
      <ClearableTextInput
        label="Бренд"
        placeholder="Бренд"
        value={electronicsParams.brand ?? ''}
        onChange={(nextValue) => setParams({ ...electronicsParams, brand: nextValue || undefined })}
        onClear={() => setParams({ ...electronicsParams, brand: undefined })}
        styles={maybeWarnIfEmpty(false, electronicsParams.brand)}
      />
      <ClearableTextInput
        label="Модель"
        placeholder="Модель"
        value={electronicsParams.model ?? ''}
        onChange={(nextValue) => setParams({ ...electronicsParams, model: nextValue || undefined })}
        onClear={() => setParams({ ...electronicsParams, model: undefined })}
        styles={maybeWarnIfEmpty(false, electronicsParams.model)}
      />
      <Select
        label="Состояние"
        placeholder="Выберите"
        clearable
        data={ELECTRONICS_CONDITION_OPTIONS}
        value={electronicsParams.condition ?? null}
        onChange={(value) =>
          setParams({
            ...electronicsParams,
            condition: (value ?? undefined) as ParamsElectronics['condition'] | undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, electronicsParams.condition)}
      />
      <ClearableTextInput
        label="Цвет"
        placeholder="Цвет"
        value={electronicsParams.color ?? ''}
        onChange={(nextValue) => setParams({ ...electronicsParams, color: nextValue || undefined })}
        onClear={() => setParams({ ...electronicsParams, color: undefined })}
        styles={maybeWarnIfEmpty(false, electronicsParams.color)}
      />
    </Stack>
  );
});

export const CategoryParamsFields = memo(function CategoryParamsFields({
  category,
  params,
  setParams,
  maybeWarnIfEmpty,
}: CategoryParamsProps & { category: Category }) {
  if (category === ITEM_CATEGORIES.AUTO) {
    return <AutoParamsFields params={params} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
  }
  if (category === ITEM_CATEGORIES.REAL_ESTATE) {
    return <RealEstateParamsFields params={params} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
  }
  return <ElectronicsParamsFields params={params} setParams={setParams} maybeWarnIfEmpty={maybeWarnIfEmpty} />;
});
