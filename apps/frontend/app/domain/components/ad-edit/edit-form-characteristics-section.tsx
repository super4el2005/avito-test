import { Container, Stack, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

import type { ItemEditFormValues } from '../../models/types';
import { CategoryParamsFields } from '../category-params-fields';
import type { MaybeWarnIfEmpty } from '../category-params-fields';

export type EditFormCharacteristicsSectionProps = {
  form: UseFormReturnType<ItemEditFormValues>;
  setCategoryParams: (next: ItemEditFormValues['params']) => void;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
};

export function EditFormCharacteristicsSection({ form, setCategoryParams, maybeWarnIfEmpty }: EditFormCharacteristicsSectionProps) {
  return (
    <Stack gap="sm">
      <Title order={4}>Характеристики</Title>
      <Container ml={0} w={600} p={0}>
        <CategoryParamsFields
          category={form.values.category}
          params={form.values.params}
          setParams={setCategoryParams}
          maybeWarnIfEmpty={maybeWarnIfEmpty}
        />
      </Container>
    </Stack>
  );
}
