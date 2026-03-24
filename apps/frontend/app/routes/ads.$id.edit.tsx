import {
  ActionIcon,
  Alert,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Paper,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

import { useMutation, useQuery } from '@tanstack/react-query';

import { diffWordsWithSpace } from 'diff';

import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { MdChatBubbleOutline, MdInfo, MdLightbulbOutline, MdOutlineClear } from 'react-icons/md';

import { Link, useNavigate, useParams } from 'react-router';

import { ITEM_CATEGORIES } from '@ads/shared';
import type { Item } from '@ads/shared';

import { aiChatAboutItem, type AiChatMessage, aiSuggestDescription, aiSuggestPrice, apiAds } from '~/api';
import { extractErrorMessage, parseSuggestedNumber,useAsyncPopoverRequest } from '~/lib';
import { queryClient } from '~/root';

type Category = (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];

type ParamsAuto = NonNullable<Extract<Item, { category: 'auto' }>['params']>;
type ParamsRealEstate = NonNullable<Extract<Item, { category: 'real_estate' }>['params']>;
type ParamsElectronics = NonNullable<Extract<Item, { category: 'electronics' }>['params']>;

type EditFormValues =
  | {
      category: 'auto';
      title: string;
      price: number | null;
      description: string;
      params: Partial<ParamsAuto>;
    }
  | {
      category: 'real_estate';
      title: string;
      price: number | null;
      description: string;
      params: Partial<ParamsRealEstate>;
    }
  | {
      category: 'electronics';
      title: string;
      price: number | null;
      description: string;
      params: Partial<ParamsElectronics>;
    };

type ItemDetailsResponse = Item & {
  needsRevision: boolean;
  missingParams: string[];
};

const CATEGORIES_TRANSLATE: Record<Category, string> = {
  [ITEM_CATEGORIES.AUTO]: 'Автомобили',
  [ITEM_CATEGORIES.REAL_ESTATE]: 'Недвижимость',
  [ITEM_CATEGORIES.ELECTRONICS]: 'Электроника',
};

function getAiErrorMessage(_error: unknown): string {
  return 'Произошла ошибка при запросе к AI\nПопробуйте повторить запрос или закройте уведомление';
}

const AUTO_TRANSMISSION_OPTIONS = [
  { value: 'automatic', label: 'Автомат' },
  { value: 'manual', label: 'Механика' },
];

const REAL_ESTATE_TYPE_OPTIONS = [
  { value: 'flat', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'room', label: 'Комната' },
];

const ELECTRONICS_TYPE_OPTIONS = [
  { value: 'phone', label: 'Телефон' },
  { value: 'laptop', label: 'Ноутбук' },
  { value: 'misc', label: 'Разное' },
];

const ELECTRONICS_CONDITION_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'used', label: 'Б/У' },
];

const DiffText = memo(({ before, after }: { before: string; after: string }) => {
  const parts = useMemo(() => diffWordsWithSpace(before ?? '', after ?? ''), [before, after]);
  return (
    <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
      {parts.map((part, idx) => {
        const bg = part.added ? 'rgba(64, 192, 87, 0.18)' : part.removed ? 'rgba(250, 82, 82, 0.16)' : undefined;
        const decoration = part.removed ? 'line-through' : undefined;
        return (
          <Text
            key={idx}
            span
            style={{
              background: bg,
              textDecoration: decoration,
            }}
          >
            {part.value}
          </Text>
        );
      })}
    </Text>
  );
});

type CategoryParamsProps = {
  params: Record<string, unknown>;
  setParams: (next: Record<string, unknown>) => void;
  maybeWarnIfEmpty: (isRequired: boolean, value: unknown) => WarningInputStyles | undefined;
};

type WarningInputStyles = {
  input: {
    borderColor: string;
  };
};

const AutoParamsFields = memo(function AutoParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  return (
    <Stack gap="sm">
      <Select
        label="Коробка передач"
        placeholder="Выберите"
        clearable
        data={AUTO_TRANSMISSION_OPTIONS}
        value={(params as any).transmission ?? null}
        onChange={(value) =>
          setParams({
            ...params,
            transmission: (value ?? undefined) as any,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).transmission)}
      />

      <TextInput
        label="Марка"
        placeholder="Марка"
        value={(params as any).brand ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            brand: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).brand ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  brand: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).brand)}
      />

      <TextInput
        label="Модель"
        placeholder="Модель"
        value={(params as any).model ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            model: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).model ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  model: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).model)}
      />

      <NumberInput
        label="Год выпуска"
        placeholder="Год"
        hideControls
        min={1900}
        value={(params as any).yearOfManufacture ?? undefined}
        onChange={(value) =>
          setParams({
            ...params,
            yearOfManufacture: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).yearOfManufacture)}
      />

      <NumberInput
        label="Пробег (км)"
        placeholder="Пробег"
        hideControls
        min={0}
        value={(params as any).mileage ?? undefined}
        onChange={(value) =>
          setParams({
            ...params,
            mileage: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).mileage)}
      />

      <NumberInput
        label="Мощность двигателя (л.с.)"
        placeholder="Мощность"
        hideControls
        min={0}
        value={(params as any).enginePower ?? undefined}
        onChange={(value) =>
          setParams({
            ...params,
            enginePower: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).enginePower)}
      />
    </Stack>
  );
});

const RealEstateParamsFields = memo(function RealEstateParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  return (
    <Stack gap="sm">
      <Select
        label="Тип"
        placeholder="Выберите"
        clearable
        data={REAL_ESTATE_TYPE_OPTIONS}
        value={(params as any).type ?? null}
        onChange={(value) =>
          setParams({
            ...params,
            type: (value ?? undefined) as any,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).type)}
      />

      <TextInput
        label="Адрес"
        placeholder="Адрес"
        value={(params as any).address ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            address: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).address ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  address: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).address)}
      />

      <NumberInput
        label="Площадь (м²)"
        placeholder="Площадь"
        hideControls
        min={0}
        value={(params as any).area ?? undefined}
        onChange={(value) =>
          setParams({
            ...params,
            area: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).area)}
      />

      <NumberInput
        label="Этаж"
        placeholder="Этаж"
        hideControls
        min={0}
        value={(params as any).floor ?? undefined}
        onChange={(value) =>
          setParams({
            ...params,
            floor: typeof value === 'number' ? value : undefined,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).floor)}
      />
    </Stack>
  );
});

const ElectronicsParamsFields = memo(function ElectronicsParamsFields({ params, setParams, maybeWarnIfEmpty }: CategoryParamsProps) {
  return (
    <Stack gap="sm">
      <Select
        label="Тип"
        placeholder="Выберите"
        clearable
        data={ELECTRONICS_TYPE_OPTIONS}
        value={(params as any).type ?? null}
        onChange={(value) =>
          setParams({
            ...params,
            type: (value ?? undefined) as any,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).type)}
      />

      <TextInput
        label="Бренд"
        placeholder="Бренд"
        value={(params as any).brand ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            brand: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).brand ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  brand: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).brand)}
      />

      <TextInput
        label="Модель"
        placeholder="Модель"
        value={(params as any).model ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            model: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).model ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  model: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).model)}
      />

      <Select
        label="Состояние"
        placeholder="Выберите"
        clearable
        data={ELECTRONICS_CONDITION_OPTIONS}
        value={(params as any).condition ?? null}
        onChange={(value) =>
          setParams({
            ...params,
            condition: (value ?? undefined) as any,
          })
        }
        styles={maybeWarnIfEmpty(false, (params as any).condition)}
      />

      <TextInput
        label="Цвет"
        placeholder="Цвет"
        value={(params as any).color ?? ''}
        onChange={(e) =>
          setParams({
            ...params,
            color: e.currentTarget.value || undefined,
          })
        }
        rightSection={
          (params as any).color ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Очистить"
              onClick={() =>
                setParams({
                  ...params,
                  color: undefined,
                })
              }
            >
              <MdOutlineClear size={18} />
            </ActionIcon>
          ) : null
        }
        styles={maybeWarnIfEmpty(false, (params as any).color)}
      />
    </Stack>
  );
});

const CategoryParamsFields = memo(function CategoryParamsFields({
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

type ChatContextRef = {
  id: string;
  title: string;
  category: Category;
  params: unknown;
  price: number | null;
  description?: string;
};

const AiChatWidget = memo(function AiChatWidget({ itemContext }: { itemContext: ChatContextRef }) {
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useDisclosure(false);

  const chatMutation = useMutation({
    mutationFn: async (nextMessages: AiChatMessage[]) => {
      const res = await aiChatAboutItem(
        {
          itemContext: {
            id: itemContext.id,
            title: itemContext.title,
            category: itemContext.category,
            params: itemContext.params as any,
            price: itemContext.price,
            description: itemContext.description,
          },
          messages: nextMessages,
        },
        undefined,
      );
      return res.text;
    },
    onSuccess: (text) => {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Произошла ошибка при запросе к AI. Попробуйте повторить вопрос.',
        },
      ]);
    },
  });

  return (
    <Popover
      position="top-end"
      withArrow
      shadow="md"
      opened={isChatWidgetOpen}
      onChange={setIsChatWidgetOpen.toggle}
      closeOnClickOutside
      closeOnEscape
    >
      <Popover.Target>
        <ActionIcon
          onClick={() => setIsChatWidgetOpen.open()}
          variant="filled"
          size={52}
          radius={999}
          aria-label="Открыть чат с AI"
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 3000 }}
        >
          <MdChatBubbleOutline size={22} />
        </ActionIcon>
      </Popover.Target>
      {isChatWidgetOpen && (
        <Popover.Dropdown>
          <Stack gap="sm" w={420}>
            <Group justify="space-between" align="center">
              <Title order={5}>Чат с AI</Title>
              <ActionIcon variant="subtle" color="gray" aria-label="Закрыть чат" onClick={() => setIsChatWidgetOpen.close()}>
                <MdOutlineClear size={18} />
              </ActionIcon>
            </Group>
            <Paper withBorder radius="md" p="sm">
              <Stack gap="sm">
                <ScrollArea h={260} offsetScrollbars>
                  <Stack gap="xs">
                    {chatMessages.length === 0 ? (
                      <Text c="dimmed">Задайте уточняющий вопрос по этому объявлению — контекст передаётся автоматически.</Text>
                    ) : (
                      chatMessages.map((m, idx) => (
                        <Group key={idx} justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                          <Paper
                            withBorder
                            radius="md"
                            p="sm"
                            style={{
                              maxWidth: 320,
                              background: m.role === 'user' ? 'rgba(34, 139, 230, 0.08)' : undefined,
                            }}
                          >
                            <Text fw={600} size="xs" c="dimmed" mb={4}>
                              {m.role === 'user' ? 'Вы' : 'AI'}
                            </Text>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
                          </Paper>
                        </Group>
                      ))
                    )}
                  </Stack>
                </ScrollArea>

                <Group align="flex-end" wrap="nowrap">
                  <Textarea
                    flex={1}
                    placeholder="Ваш вопрос…"
                    minRows={2}
                    autosize
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.currentTarget.value)}
                  />
                  <Button
                    loading={chatMutation.isPending}
                    disabled={!chatDraft.trim()}
                    onClick={() => {
                      const userMessage: AiChatMessage = {
                        role: 'user',
                        content: chatDraft.trim(),
                      };
                      const next = [...chatMessages, userMessage];
                      setChatMessages(next);
                      setChatDraft('');
                      chatMutation.mutate(next);
                    }}
                  >
                    Отправить
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Popover.Dropdown>
      )}
    </Popover>
  );
});

function mapItemToEditValues(item: ItemDetailsResponse): EditFormValues {
  return {
    category: item.category,
    title: item.title ?? '',
    price: item.price ?? null,
    description: item.description ?? '',
    params: (item.params ?? {}) as any,
  } as EditFormValues;
}

function AdsEditForm({ id, item }: { id: string; item: ItemDetailsResponse }) {
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const form = useForm<EditFormValues>({
    initialValues: mapItemToEditValues(item),
    validateInputOnBlur: true,
    validate: (values: EditFormValues) => ({
      category: !values.category ? 'Категория должна быть заполнена' : null,
      title: !values.title.trim() ? 'Название должно быть заполнено' : null,
      price: values.price === null ? 'Цена должна быть заполнена' : null,
    }),
  });

  const paramsByCategoryRef = useRef<Record<Category, unknown>>({
    [ITEM_CATEGORIES.AUTO]: {},
    [ITEM_CATEGORIES.REAL_ESTATE]: {},
    [ITEM_CATEGORIES.ELECTRONICS]: {},
    [item.category]: (item.params ?? {}) as any,
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
      form.setFieldValue('params', next as any);
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
    mutationFn: async (values: EditFormValues) => {
      const payload = {
        category: values.category,
        title: values.title.trim(),
        price: values.price,
        description: values.description?.trim() ? values.description.trim() : undefined,
        params: values.params ?? {},
      };
      return apiAds.put(`/items/${id}`, payload);
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
        params: (form.values.params ?? {}) as any,
        description: form.values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: getAiErrorMessage,
  });

  const [descriptionAiBeforeText, setDescriptionAiBeforeText] = useState<string>('');

  const descriptionAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      setDescriptionAiBeforeText(form.values.description);
      const res = await aiSuggestDescription({
        title: form.values.title,
        category: form.values.category,
        params: (form.values.params ?? {}) as any,
        description: form.values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: getAiErrorMessage,
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
                  params: nextParams as any,
                } as EditFormValues);

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
                rightSection={
                  form.values.title ? (
                    <ActionIcon variant="subtle" color="gray" aria-label="Очистить" onClick={() => form.setFieldValue('title', '')}>
                      <MdOutlineClear size={18} />
                    </ActionIcon>
                  ) : null
                }
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
                      <ActionIcon variant="subtle" color="gray" aria-label="Очистить" onClick={() => form.setFieldValue('price', null)}>
                        <MdOutlineClear size={18} />
                      </ActionIcon>
                    ) : null
                  }
                />
                <Popover
                  position="bottom-start"
                  withArrow
                  shadow="md"
                  opened={priceAiState.isOpen}
                  onChange={priceAiState.setIsOpen}
                  closeOnClickOutside={false}
                  closeOnEscape={false}
                >
                  <Popover.Target>
                    <Button
                      variant="light"
                      leftSection={<MdLightbulbOutline size={20} />}
                      loading={priceAiState.isPending}
                      onClick={priceAiState.run}
                    >
                      {priceAiState.isPending ? 'Выполняется запрос' : priceAiState.hasEverRun ? 'Повторить запрос' : 'Узнать рыночную цену'}
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Stack gap="sm" w={420}>
                      {priceAiState.error ? (
                        <>
                          <Title order={5} c="red">
                            Произошла ошибка при запросе к AI
                          </Title>
                          <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                            {priceAiState.error}
                          </Text>
                          <Group justify="flex-start">
                            <Button variant="default" onClick={() => priceAiState.setIsOpen(false)}>
                              Закрыть
                            </Button>
                          </Group>
                        </>
                      ) : (
                        <>
                          <Title order={5}>Ответ AI:</Title>
                          <Text style={{ whiteSpace: 'pre-wrap' }}>{priceAiState.data ?? ''}</Text>
                          <Group justify="flex-start">
                            <Button
                              onClick={() => {
                                if (aiSuggestedPrice !== null) form.setFieldValue('price', aiSuggestedPrice);
                                priceAiState.setIsOpen(false);
                              }}
                              disabled={aiSuggestedPrice === null}
                            >
                              Применить
                            </Button>
                            <Button variant="default" onClick={() => priceAiState.setIsOpen(false)}>
                              Закрыть
                            </Button>
                          </Group>
                        </>
                      )}
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
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
                  <ActionIcon variant="subtle" color="gray" aria-label="Очистить" onClick={() => form.setFieldValue('description', '')}>
                    <MdOutlineClear size={18} />
                  </ActionIcon>
                ) : null
              }
              styles={maybeWarnIfEmpty(false, form.values.description)}
            />
            <Popover
              position="bottom-start"
              withArrow
              shadow="md"
              opened={descriptionAiState.isOpen}
              onChange={descriptionAiState.setIsOpen}
              closeOnClickOutside={false}
              closeOnEscape={false}
            >
              <Popover.Target>
                <Button
                  w="min-content"
                  variant="light"
                  leftSection={<MdLightbulbOutline size={20} />}
                  loading={descriptionAiState.isPending}
                  onClick={descriptionAiState.run}
                >
                  {descriptionAiState.isPending
                    ? 'Выполняется запрос'
                    : descriptionAiState.hasEverRun
                      ? 'Повторить запрос'
                      : form.values.description.trim()
                        ? 'Улучшить описание'
                        : 'Придумать описание'}
                </Button>
              </Popover.Target>

              <Popover.Dropdown>
                <Stack gap="sm" w={420}>
                  {descriptionAiState.error ? (
                    <>
                      <Title order={5} c="red">
                        Произошла ошибка при запросе к AI
                      </Title>
                      <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                        {descriptionAiState.error}
                      </Text>
                      <Group justify="flex-start">
                        <Button variant="default" onClick={() => descriptionAiState.setIsOpen(false)}>
                          Закрыть
                        </Button>
                      </Group>
                    </>
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
                      <Group justify="flex-start">
                        <Button
                          onClick={() => {
                            form.setFieldValue('description', descriptionAiState.data ?? '');
                            descriptionAiState.setIsOpen(false);
                          }}
                          disabled={!descriptionAiState.data}
                        >
                          Применить
                        </Button>
                        <Button variant="default" onClick={() => descriptionAiState.setIsOpen(false)}>
                          Закрыть
                        </Button>
                      </Group>
                    </>
                  )}
                </Stack>
              </Popover.Dropdown>
            </Popover>
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
