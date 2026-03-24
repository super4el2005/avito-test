import { Container, Divider, Group, NumberInput, Select, Stack, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

import type { Category, ItemEditFormValues } from '../../models/types';
import { AdEditAiSuggestBlock } from './ad-edit-ai-suggest-block';

import type { AsyncPopoverRequestState } from '~/shared';
import { ClearFieldAction } from '~/shared';

export type EditFormBasicsSectionProps = {
  categoryOptions: ReadonlyArray<{ value: Category; label: string }>;
  form: UseFormReturnType<ItemEditFormValues>;
  onCategoryChange: (value: string | null) => void;
  priceAiState: AsyncPopoverRequestState<string>;
  aiSuggestedPrice: number | null;
  onClosePricePopover: () => void;
  onApplySuggestedPrice: () => void;
};

export function EditFormBasicsSection({
  categoryOptions,
  form,
  onCategoryChange,
  priceAiState,
  aiSuggestedPrice,
  onClosePricePopover,
  onApplySuggestedPrice,
}: EditFormBasicsSectionProps) {
  return (
    <Stack gap="sm">
      <Select
        w={300}
        label="Категория"
        data={categoryOptions}
        allowDeselect={false}
        withAsterisk
        value={form.values.category}
        onChange={onCategoryChange}
        error={form.errors.category}
        onBlur={() => form.validateField('category')}
      />

      <Divider my={5} />
      <Container ml={0} p={0} w={600}>
        <TextInput
          label="Название"
          withAsterisk
          placeholder="Название"
          {...form.getInputProps('title')}
          rightSection={form.values.title ? <ClearFieldAction onClick={() => form.setFieldValue('title', '')} /> : null}
        />

        <Group align="flex-end">
          <NumberInput
            label="Цена"
            withAsterisk
            placeholder="Цена"
            min={0}
            hideControls
            value={form.values.price ?? undefined}
            onChange={(value) => form.setFieldValue('price', typeof value === 'number' ? value : null)}
            onBlur={() => form.validateField('price')}
            error={form.errors.price}
            rightSection={
              form.values.price !== null ? <ClearFieldAction onClick={() => form.setFieldValue('price', null)} /> : null
            }
          />
          <AdEditAiSuggestBlock
            aiState={priceAiState}
            buttonLabel="Узнать рыночную цену"
            errorMessage={priceAiState.error}
            responseText={priceAiState.data ?? ''}
            onClose={onClosePricePopover}
            onApply={onApplySuggestedPrice}
            isApplyDisabled={aiSuggestedPrice === null}
          />
        </Group>
      </Container>
    </Stack>
  );
}
