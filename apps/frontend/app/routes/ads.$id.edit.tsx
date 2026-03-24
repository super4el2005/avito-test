import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';

import { useQuery } from '@tanstack/react-query';

import { lazy, Suspense, useCallback, useMemo } from 'react';

import { MdInfo } from 'react-icons/md';

import { Link, useParams } from 'react-router';

import { apiAds } from '~/api';
import {
  AiPopoverActions,
  AiPopoverError,
  AiSuggestionPopover,
  CategoryParamsFields,
  type ItemDetailsResponse,
  useAdEditAi,
  useAdEditFormModel,
} from '~/domain';
import { ClearFieldAction } from '~/shared';

const AiChatWidgetLazy = lazy(async () => {
  const module = await import('~/domain/components/ai-assist');
  return { default: module.AiChatWidget };
});
const DiffTextLazy = lazy(async () => {
  const module = await import('~/domain/components/diff-text');
  return { default: module.DiffText };
});

function AdsEditForm({ id, item }: { id: string; item: ItemDetailsResponse }) {
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

          <Stack gap="sm">
            <Select
              w={300}
              label="Категория"
              data={adEditFormModel.categoryOptions}
              allowDeselect={false}
              withAsterisk
              value={adEditFormModel.form.values.category}
              onChange={adEditFormModel.onCategoryChange}
              error={adEditFormModel.form.errors.category}
              onBlur={() => adEditFormModel.form.validateField('category')}
            />

            <Divider my={5} />
            <Container ml={0} p={0} w={600}>
              <TextInput
                label="Название"
                withAsterisk
                placeholder="Название"
                {...adEditFormModel.form.getInputProps('title')}
                rightSection={adEditFormModel.form.values.title ? <ClearFieldAction onClick={() => adEditFormModel.form.setFieldValue('title', '')} /> : null}
              />

              <Group align="flex-end">
                <NumberInput
                  label="Цена"
                  withAsterisk
                  placeholder="Цена"
                  min={0}
                  hideControls
                  value={adEditFormModel.form.values.price ?? undefined}
                  onChange={(value) => adEditFormModel.form.setFieldValue('price', typeof value === 'number' ? value : null)}
                  onBlur={() => adEditFormModel.form.validateField('price')}
                  error={adEditFormModel.form.errors.price}
                  rightSection={
                    adEditFormModel.form.values.price !== null ? (
                      <ClearFieldAction onClick={() => adEditFormModel.form.setFieldValue('price', null)} />
                    ) : null
                  }
                />
                <AiSuggestionPopover
                  isOpen={adEditAi.priceAiState.isOpen}
                  setIsOpen={adEditAi.priceAiState.setIsOpen}
                  isPending={adEditAi.priceAiState.isPending}
                  hasEverRun={adEditAi.priceAiState.hasEverRun}
                  onRun={adEditAi.priceAiState.run}
                  buttonLabel="Узнать рыночную цену"
                >
                  {adEditAi.priceAiState.error ? (
                    <AiPopoverError message={adEditAi.priceAiState.error} onClose={closePricePopover} />
                  ) : (
                    <>
                      <Title order={5}>Ответ AI:</Title>
                      <Text style={{ whiteSpace: 'pre-wrap' }}>{adEditAi.priceAiState.data ?? ''}</Text>
                      <AiPopoverActions
                        onApply={applySuggestedPrice}
                        onClose={closePricePopover}
                        isApplyDisabled={adEditAi.aiSuggestedPrice === null}
                      />
                    </>
                  )}
                </AiSuggestionPopover>
              </Group>
            </Container>
          </Stack>

          <Divider my={5} />

          <Stack gap="sm">
            <Title order={4}>Характеристики</Title>
            <Container ml={0} w={600} p={0}>
              <CategoryParamsFields
                category={adEditFormModel.form.values.category}
                params={adEditFormModel.form.values.params}
                setParams={adEditFormModel.setCategoryParams}
                maybeWarnIfEmpty={adEditFormModel.maybeWarnIfEmpty}
              />
            </Container>
          </Stack>

          <Divider />

          <Stack gap="sm">
            <Title order={4}>Описание</Title>
            <Textarea
              placeholder="Описание"
              minRows={5}
              autosize
              value={adEditFormModel.form.values.description}
              onChange={(e) => adEditFormModel.form.setFieldValue('description', e.currentTarget.value)}
              rightSection={
                adEditFormModel.form.values.description ? (
                  <ClearFieldAction onClick={() => adEditFormModel.form.setFieldValue('description', '')} />
                ) : null
              }
              styles={adEditFormModel.maybeWarnIfEmpty(false, adEditFormModel.form.values.description)}
            />
            <AiSuggestionPopover
              isOpen={adEditAi.descriptionAiState.isOpen}
              setIsOpen={adEditAi.descriptionAiState.setIsOpen}
              isPending={adEditAi.descriptionAiState.isPending}
              hasEverRun={adEditAi.descriptionAiState.hasEverRun}
              onRun={adEditAi.descriptionAiState.run}
              buttonWidth="min-content"
              buttonLabel={adEditFormModel.form.values.description.trim() ? 'Улучшить описание' : 'Придумать описание'}
            >
              {adEditAi.descriptionAiState.error ? (
                <AiPopoverError message={adEditAi.descriptionAiState.error} onClose={closeDescriptionPopover} />
              ) : (
                <>
                  <Title order={5}>Ответ AI:</Title>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{adEditAi.descriptionAiState.data ?? ''}</Text>
                  {!!adEditAi.descriptionAiState.data && (
                    <>
                      <Divider />
                      <Group align="flex-start" grow>
                        <Stack gap={6}>
                          <Text fw={600} size="sm">
                            Было
                          </Text>
                          <Paper withBorder p="sm" radius="md">
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{adEditAi.descriptionAiBeforeText || '—'}</Text>
                          </Paper>
                        </Stack>
                        <Stack gap={6}>
                          <Text fw={600} size="sm">
                            Стало
                          </Text>
                          <Paper withBorder p="sm" radius="md">
                            <Suspense fallback={<Text c="dimmed">Сравниваем...</Text>}>
                              <DiffTextLazy before={adEditAi.descriptionAiBeforeText || ''} after={adEditAi.descriptionAiState.data} />
                            </Suspense>
                          </Paper>
                        </Stack>
                      </Group>
                    </>
                  )}
                  <AiPopoverActions
                    onApply={applySuggestedDescription}
                    onClose={closeDescriptionPopover}
                    isApplyDisabled={!adEditAi.descriptionAiState.data}
                  />
                </>
              )}
            </AiSuggestionPopover>
          </Stack>

          <Group justify="flex-start" mt="sm">
            <Button
              onClick={submitEditForm}
              disabled={!adEditFormModel.requiredOk || adEditFormModel.updateAdMutation.isPending}
              loading={adEditFormModel.updateAdMutation.isPending}
            >
              Сохранить
            </Button>
            <Button variant="default" component={Link} to={`/ads/${id}`}>
              Отменить
            </Button>
          </Group>
        </Stack>
      </Container>

      <Suspense fallback={null}>
        <AiChatWidgetLazy itemContext={adEditAi.chatContext} />
      </Suspense>
    </>
  );
}

export default function () {
  const params = useParams();
  const id = params.id ?? '';

  const getAdQuery = useQuery({
    queryKey: ['ad', id],
    queryFn: ({ signal }) => apiAds.get<ItemDetailsResponse>(`/items/${id}`, { signal }),
    enabled: Boolean(id),
  });

  if (getAdQuery.isError) {
    return (
      <Container>
        <Stack pt={30}>
          <Alert color="red" title="Ошибка" icon={<MdInfo />}>
            Не удалось загрузить объявление
          </Alert>
          <Button component={Link} to="/ads">
            На главную
          </Button>
        </Stack>
      </Container>
    );
  }

  if (getAdQuery.isLoading || !getAdQuery.data?.data) {
    return (
      <Container size="xl" pt={30}>
        <Stack gap="md">
          <Title order={3}>Редактирование объявления</Title>
          <Text c="dimmed">Загрузка…</Text>
        </Stack>
      </Container>
    );
  }

  return <AdsEditForm id={id} item={getAdQuery.data.data} />;
}
