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
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useCallback, useMemo, useRef, useState } from 'react';

import { MdInfo } from 'react-icons/md';

import { Link, useNavigate, useParams } from 'react-router';

import { ITEM_CATEGORIES, ItemUpdateInSchema } from '@ads/shared';

import { aiSuggestDescription, aiSuggestPrice, apiAds } from '~/api';
import {
  AI_REQUEST_ERROR_MESSAGE,
  AiChatWidget,
  AiPopoverActions,
  AiPopoverError,
  AiSuggestionPopover,
  CATEGORIES_TRANSLATE,
  CategoryParamsFields,
  DiffText,
  mapItemDetailsToEditFormValues,
  type Category,
  type ChatContextRef,
  type ItemEditFormValues,
  type ItemDetailsResponse,
} from '~/domain';
import { queryClient } from '~/root';
import { ClearFieldAction, extractErrorMessage, parseSuggestedNumber, useAsyncPopoverRequest } from '~/shared';

function AdsEditForm({ id, item }: { id: string; item: ItemDetailsResponse }) {
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const form = useForm<ItemEditFormValues>({
    initialValues: mapItemDetailsToEditFormValues(item),
    validateInputOnBlur: true,
    validate: (values: ItemEditFormValues) => ({
      category: !values.category ? 'Категория должна быть заполнена' : null,
      title: !values.title.trim() ? 'Название должно быть заполнено' : null,
      price: values.price === null ? 'Цена должна быть заполнена' : null,
    }),
  });

  const paramsByCategoryRef = useRef<Record<Category, unknown>>({
    [ITEM_CATEGORIES.AUTO]: {},
    [ITEM_CATEGORIES.REAL_ESTATE]: {},
    [ITEM_CATEGORIES.ELECTRONICS]: {},
    [item.category]: item.params ?? {},
  });

  const warningStyles = useMemo(
    () => ({
      input: {
        borderColor: theme.colors.yellow[6],
      },
    }),
    [theme.colors.yellow],
  );

  const maybeWarnIfEmpty = useCallback(
    (isRequired: boolean, value: unknown) => {
      if (isRequired) return undefined;
      const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      return isEmpty ? warningStyles : undefined;
    },
    [warningStyles],
  );

  const setCategoryParams = useCallback(
    (next: Record<string, unknown>) => {
      form.setFieldValue('params', next as ItemEditFormValues['params']);
    },
    [form],
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
      await queryClient.fetchQuery({
        queryKey: ['ad', id],
        queryFn: ({ signal }) => apiAds.get<ItemDetailsResponse>(`/items/${id}`, { signal }),
      });

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

  const priceAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      const res = await aiSuggestPrice({
        title: form.values.title,
        category: form.values.category,
        params: (form.values.params ?? {}) as Record<string, unknown>,
        description: form.values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: (error) =>
      extractErrorMessage(
        error,
        AI_REQUEST_ERROR_MESSAGE,
      ),
  });

  const [descriptionAiBeforeText, setDescriptionAiBeforeText] = useState<string>('');

  const descriptionAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      setDescriptionAiBeforeText(form.values.description);
      const res = await aiSuggestDescription({
        title: form.values.title,
        category: form.values.category,
        params: (form.values.params ?? {}) as Record<string, unknown>,
        description: form.values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: (error) =>
      extractErrorMessage(
        error,
        AI_REQUEST_ERROR_MESSAGE,
      ),
  });

  const aiSuggestedPrice = useMemo(() => parseSuggestedNumber(priceAiState.data ?? ''), [priceAiState.data]);

  const chatContext = useMemo<ChatContextRef>(
    () => ({
      id,
      title: form.values.title,
      category: form.values.category,
      params: form.values.params ?? {},
      price: form.values.price,
      description: form.values.description || undefined,
    }),
    [id, form.values.title, form.values.category, form.values.params, form.values.price, form.values.description],
  );

  const requiredOk = Boolean(form.values.category) && Boolean(form.values.title.trim()) && form.values.price !== null;

  return (
    <>
      <Container size="xl" pt={30}>
        <Stack gap="md">
          <Title>Редактирование объявления</Title>

          <Stack gap="sm">
            <Select
              w={300}
              label="Категория"
              data={categoryOptions}
              allowDeselect={false}
              withAsterisk
              value={form.values.category}
              onChange={(value) => {
                const nextCategory = (value ?? ITEM_CATEGORIES.ELECTRONICS) as Category;
                const currentCategory = form.values.category as Category;
                paramsByCategoryRef.current[currentCategory] = form.values.params ?? {};

                const nextParams = paramsByCategoryRef.current[nextCategory] ?? {};

                form.setValues({
                  ...form.values,
                  category: nextCategory,
                  params: nextParams as ItemEditFormValues['params'],
                } as ItemEditFormValues);

                form.setDirty({
                  category: true,
                  params: true,
                });
              }}
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
                    form.values.price !== null ? (
                      <ClearFieldAction onClick={() => form.setFieldValue('price', null)} />
                    ) : null
                  }
                />
                <AiSuggestionPopover
                  isOpen={priceAiState.isOpen}
                  setIsOpen={priceAiState.setIsOpen}
                  isPending={priceAiState.isPending}
                  hasEverRun={priceAiState.hasEverRun}
                  onRun={priceAiState.run}
                  buttonLabel="Узнать рыночную цену"
                >
                  {priceAiState.error ? (
                    <AiPopoverError message={priceAiState.error} onClose={() => priceAiState.setIsOpen(false)} />
                  ) : (
                    <>
                      <Title order={5}>Ответ AI:</Title>
                      <Text style={{ whiteSpace: 'pre-wrap' }}>{priceAiState.data ?? ''}</Text>
                      <AiPopoverActions
                        onApply={() => {
                          if (aiSuggestedPrice !== null) form.setFieldValue('price', aiSuggestedPrice);
                          priceAiState.setIsOpen(false);
                        }}
                        onClose={() => priceAiState.setIsOpen(false)}
                        isApplyDisabled={aiSuggestedPrice === null}
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
                category={form.values.category}
                params={(form.values.params ?? {}) as Record<string, unknown>}
                setParams={setCategoryParams}
                maybeWarnIfEmpty={maybeWarnIfEmpty}
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
              value={form.values.description}
              onChange={(e) => form.setFieldValue('description', e.currentTarget.value)}
              rightSection={
                form.values.description ? (
                  <ClearFieldAction onClick={() => form.setFieldValue('description', '')} />
                ) : null
              }
              styles={maybeWarnIfEmpty(false, form.values.description)}
            />
            <AiSuggestionPopover
              isOpen={descriptionAiState.isOpen}
              setIsOpen={descriptionAiState.setIsOpen}
              isPending={descriptionAiState.isPending}
              hasEverRun={descriptionAiState.hasEverRun}
              onRun={descriptionAiState.run}
              buttonWidth="min-content"
              buttonLabel={form.values.description.trim() ? 'Улучшить описание' : 'Придумать описание'}
            >
              {descriptionAiState.error ? (
                <AiPopoverError message={descriptionAiState.error} onClose={() => descriptionAiState.setIsOpen(false)} />
              ) : (
                <>
                  <Title order={5}>Ответ AI:</Title>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{descriptionAiState.data ?? ''}</Text>
                  {!!descriptionAiState.data && (
                    <>
                      <Divider />
                      <Group align="flex-start" grow>
                        <Stack gap={6}>
                          <Text fw={600} size="sm">
                            Было
                          </Text>
                          <Paper withBorder p="sm" radius="md">
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{descriptionAiBeforeText || '—'}</Text>
                          </Paper>
                        </Stack>
                        <Stack gap={6}>
                          <Text fw={600} size="sm">
                            Стало
                          </Text>
                          <Paper withBorder p="sm" radius="md">
                            <DiffText before={descriptionAiBeforeText || ''} after={descriptionAiState.data} />
                          </Paper>
                        </Stack>
                      </Group>
                    </>
                  )}
                  <AiPopoverActions
                    onApply={() => {
                      form.setFieldValue('description', descriptionAiState.data ?? '');
                      descriptionAiState.setIsOpen(false);
                    }}
                    onClose={() => descriptionAiState.setIsOpen(false)}
                    isApplyDisabled={!descriptionAiState.data}
                  />
                </>
              )}
            </AiSuggestionPopover>
          </Stack>

          <Group justify="flex-start" mt="sm">
            <Button
              onClick={() => {
                const result = form.validate();
                if (result.hasErrors) return;
                updateAdMutation.mutate(form.values);
              }}
              disabled={!requiredOk || updateAdMutation.isPending}
              loading={updateAdMutation.isPending}
            >
              Сохранить
            </Button>
            <Button variant="default" component={Link} to={`/ads/${id}`}>
              Отменить
            </Button>
          </Group>
        </Stack>
      </Container>

      <AiChatWidget itemContext={chatContext} />
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
