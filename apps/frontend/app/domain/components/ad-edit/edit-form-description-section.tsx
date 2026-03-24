import { Stack, Textarea, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

import { ClearFieldAction } from '~/shared';
import type { AsyncPopoverRequestState } from '~/shared';

import type { ItemEditFormValues } from '../../models/types';
import type { MaybeWarnIfEmpty } from '../category-params-fields';

import { AdEditAiSuggestBlock } from './ad-edit-ai-suggest-block';
import { DescriptionAiDiffSection } from './description-ai-diff-section';

export type EditFormDescriptionSectionProps = {
  form: UseFormReturnType<ItemEditFormValues>;
  maybeWarnIfEmpty: MaybeWarnIfEmpty;
  descriptionAiState: AsyncPopoverRequestState<string>;
  descriptionBeforeText: string;
  onCloseDescriptionPopover: () => void;
  onApplySuggestedDescription: () => void;
};

export function EditFormDescriptionSection({
  form,
  maybeWarnIfEmpty,
  descriptionAiState,
  descriptionBeforeText,
  onCloseDescriptionPopover,
  onApplySuggestedDescription,
}: EditFormDescriptionSectionProps) {
  const descriptionDiffSection = descriptionAiState.data ? (
    <DescriptionAiDiffSection beforeText={descriptionBeforeText} afterText={descriptionAiState.data} />
  ) : null;

  return (
    <Stack gap="sm">
      <Title order={4}>Описание</Title>
      <Textarea
        placeholder="Описание"
        minRows={5}
        autosize
        value={form.values.description}
        onChange={(e) => form.setFieldValue('description', e.currentTarget.value)}
        rightSection={
          form.values.description ? <ClearFieldAction onClick={() => form.setFieldValue('description', '')} /> : null
        }
        styles={maybeWarnIfEmpty(false, form.values.description)}
      />
      <AdEditAiSuggestBlock
        aiState={descriptionAiState}
        buttonWidth="min-content"
        buttonLabel={form.values.description.trim() ? 'Улучшить описание' : 'Придумать описание'}
        errorMessage={descriptionAiState.error}
        responseText={descriptionAiState.data ?? ''}
        onClose={onCloseDescriptionPopover}
        onApply={onApplySuggestedDescription}
        isApplyDisabled={!descriptionAiState.data}
        betweenBodyAndActions={descriptionDiffSection}
      />
    </Stack>
  );
}
