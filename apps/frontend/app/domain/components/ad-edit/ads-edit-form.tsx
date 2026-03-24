import { Container, Divider, Stack, Title, useMantineTheme } from '@mantine/core';

import { lazy, Suspense, useCallback, useMemo } from 'react';

import { useAdEditAi } from '../../hooks/use-ad-edit-ai';
import { useAdEditFormModel } from '../../hooks/use-ad-edit-form-model';
import type { ItemDetailsResponse } from '../../models/types';
import { EditFormBasicsSection } from './edit-form-basics-section';
import { EditFormCharacteristicsSection } from './edit-form-characteristics-section';
import { EditFormDescriptionSection } from './edit-form-description-section';
import { EditFormSubmitRow } from './edit-form-submit-row';

const AiChatWidgetLazy = lazy(async () => {
  const module = await import('../ai-assist');
  return { default: module.AiChatWidget };
});

export function AdsEditForm({ id, item }: { id: string; item: ItemDetailsResponse }) {
  const theme = useMantineTheme();

  const warningStyles = useMemo(
    () => ({
      input: {
        borderColor: theme.colors.yellow[6],
      },
    }),
    [theme.colors.yellow],
  );

  const adEditFormModel = useAdEditFormModel({
    id,
    item,
    warningStyles,
  });
  const adEditAi = useAdEditAi({
    id,
    values: adEditFormModel.form.values,
  });

  const closePricePopover = useCallback(() => {
    adEditAi.priceAiState.setIsOpen(false);
  }, [adEditAi.priceAiState]);

  const applySuggestedPrice = useCallback(() => {
    if (adEditAi.aiSuggestedPrice !== null) {
      adEditFormModel.form.setFieldValue('price', adEditAi.aiSuggestedPrice);
    }
    adEditAi.priceAiState.setIsOpen(false);
  }, [adEditAi.aiSuggestedPrice, adEditAi.priceAiState, adEditFormModel.form]);

  const closeDescriptionPopover = useCallback(() => {
    adEditAi.descriptionAiState.setIsOpen(false);
  }, [adEditAi.descriptionAiState]);

  const applySuggestedDescription = useCallback(() => {
    adEditFormModel.form.setFieldValue('description', adEditAi.descriptionAiState.data ?? '');
    adEditAi.descriptionAiState.setIsOpen(false);
  }, [adEditAi.descriptionAiState, adEditFormModel.form]);

  const submitEditForm = useCallback(() => {
    const result = adEditFormModel.form.validate();
    if (result.hasErrors) return;
    adEditFormModel.updateAdMutation.mutate(adEditFormModel.form.values);
  }, [adEditFormModel.form, adEditFormModel.updateAdMutation]);

  return (
    <>
      <Container size="xl" pt={30}>
        <Stack gap="md">
          <Title>Редактирование объявления</Title>

          <EditFormBasicsSection
            categoryOptions={adEditFormModel.categoryOptions}
            form={adEditFormModel.form}
            onCategoryChange={adEditFormModel.onCategoryChange}
            priceAiState={adEditAi.priceAiState}
            aiSuggestedPrice={adEditAi.aiSuggestedPrice}
            onClosePricePopover={closePricePopover}
            onApplySuggestedPrice={applySuggestedPrice}
          />

          <Divider my={5} />

          <EditFormCharacteristicsSection
            form={adEditFormModel.form}
            setCategoryParams={adEditFormModel.setCategoryParams}
            maybeWarnIfEmpty={adEditFormModel.maybeWarnIfEmpty}
          />

          <Divider />

          <EditFormDescriptionSection
            form={adEditFormModel.form}
            maybeWarnIfEmpty={adEditFormModel.maybeWarnIfEmpty}
            descriptionAiState={adEditAi.descriptionAiState}
            descriptionBeforeText={adEditAi.descriptionAiBeforeText}
            onCloseDescriptionPopover={closeDescriptionPopover}
            onApplySuggestedDescription={applySuggestedDescription}
          />

          <EditFormSubmitRow
            adId={id}
            onSubmit={submitEditForm}
            canSubmit={adEditFormModel.requiredOk}
            isSaving={adEditFormModel.updateAdMutation.isPending}
          />
        </Stack>
      </Container>

      <Suspense fallback={null}>
        <AiChatWidgetLazy itemContext={adEditAi.chatContext} />
      </Suspense>
    </>
  );
}
