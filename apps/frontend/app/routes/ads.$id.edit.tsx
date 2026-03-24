import type { Item } from '@ads/shared';
import { ITEM_CATEGORIES } from '@ads/shared';
import {
    ActionIcon,
    Alert,
    Button,
    Container,
    Divider,
    Group,
    Paper,
    NumberInput,
    Popover,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdInfo, MdOutlineClear, MdLightbulbOutline } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router';
import { aiChatAboutItem, aiSuggestDescription, aiSuggestPrice, apiAds, type AiChatMessage } from '~/api';
import { queryClient } from '~/root';
import { diffWordsWithSpace } from 'diff';

type Category = (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];

type ParamsAuto = NonNullable<Extract<Item, { category: 'auto' }>['params']>;
type ParamsRealEstate = NonNullable<
    Extract<Item, { category: 'real_estate' }>['params']
>;
type ParamsElectronics = NonNullable<
    Extract<Item, { category: 'electronics' }>['params']
>;

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

const getBackendErrorMessage = (error: unknown): string => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data
    ) {
        if (typeof error.response.data.error === 'string') return error.response.data.error;
        try {
            return JSON.stringify(error.response.data.error);
        } catch {
            // ignore
        }
    }

    return 'При попытке сохранить изменения произошла ошибка. Попробуйте ещё раз или зайдите позже.';
};

const getAiErrorMessage = (_error: unknown): string => {
    return 'Произошла ошибка при запросе к AI\nПопробуйте повторить запрос или закройте уведомление';
};

const parsePriceFromAiText = (text: string): number | null => {
    const normalized = text.replace(/\u00A0/g, ' ');

    const rangeMatch = normalized.match(
        /(\d[\d\s]{1,9})\s*(?:-|–|—)\s*(\d[\d\s]{1,9})\s*(?:₽|р\.?|руб\.?)?/i,
    );
    if (rangeMatch) {
        const a = Number(rangeMatch[1].replace(/\s/g, ''));
        const b = Number(rangeMatch[2].replace(/\s/g, ''));
        if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
            return Math.round((a + b) / 2);
        }
    }

    const firstNumber = normalized.match(/(\d[\d\s]{2,9})\s*(?:₽|р\.?|руб\.?)?/i);
    if (firstNumber) {
        const n = Number(firstNumber[1].replace(/\s/g, ''));
        if (Number.isFinite(n) && n > 0) return n;
    }

    return null;
};

const DiffText = ({ before, after }: { before: string; after: string }) => {
    const parts = diffWordsWithSpace(before ?? '', after ?? '');
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
};

const createEmptyValues = (category: Category): EditFormValues => {
    if (category === ITEM_CATEGORIES.AUTO) {
        return {
            category,
            title: '',
            price: null,
            description: '',
            params: {},
        };
    }
    if (category === ITEM_CATEGORIES.REAL_ESTATE) {
        return {
            category,
            title: '',
            price: null,
            description: '',
            params: {},
        };
    }
    return {
        category: ITEM_CATEGORIES.ELECTRONICS,
        title: '',
        price: null,
        description: '',
        params: {},
    };
};

export default function AdsEditRoute() {
    const params = useParams();
    const navigate = useNavigate();
    const theme = useMantineTheme();

    const id = params.id ?? '';

    const getAdQuery = useQuery({
        queryKey: ['ad', id],
        queryFn: ({ signal }) => apiAds.get<ItemDetailsResponse>(`/items/${id}`, { signal }),
        enabled: Boolean(id),
    });

    const form = useForm<EditFormValues>({
        initialValues: createEmptyValues(ITEM_CATEGORIES.ELECTRONICS),
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
    });

    useEffect(() => {
        const item = getAdQuery.data?.data;
        if (!item) return;

        const nextValues: EditFormValues = {
            category: item.category,
            title: item.title ?? '',
            price: item.price ?? null,
            description: item.description ?? '',
            params: (item.params ?? {}) as any,
        } as EditFormValues;

        form.setValues(nextValues);
        form.resetDirty(nextValues);

        paramsByCategoryRef.current[item.category] = nextValues.params ?? {};
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAdQuery.data?.data?.id]);

    const warningStyles = useMemo(
        () => ({
            input: {
                borderColor: theme.colors.yellow[6],
            },
        }),
        [theme.colors.yellow],
    );

    const maybeWarnIfEmpty = (isRequired: boolean, value: unknown) => {
        if (isRequired) return undefined;
        const isEmpty =
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '');
        return isEmpty ? warningStyles : undefined;
    };

    const categoryOptions = useMemo(
        () =>
            (Object.values(ITEM_CATEGORIES) as Category[]).map(value => ({
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
                queryFn: ({ signal }) =>
                    apiAds.get<ItemDetailsResponse>(`/items/${id}`, { signal }),
            });

            notifications.show({
                position: 'top-right',
                title: 'Изменения сохранены',
                message: '',
                color: 'green',
            });
            navigate(`/ads/${id}`);
        },
        onError: error => {
            notifications.show({
                position: 'top-right',
                title: 'Ошибка сохранения',
                message: getBackendErrorMessage(error),
                color: 'red',
            });
        },
    });

    const [isPriceAiPopoverOpen, setIsPriceAiPopoverOpen] = useState(false);
    const [priceAiText, setPriceAiText] = useState<string | null>(null);
    const [priceAiError, setPriceAiError] = useState<string | null>(null);
    const [hasPriceAiEverRun, setHasPriceAiEverRun] = useState(false);

    const priceAiMutation = useMutation({
        mutationFn: async () => {
            const res = await aiSuggestPrice({
                title: form.values.title,
                category: form.values.category,
                params: (form.values.params ?? {}) as any,
                description: form.values.description || undefined,
            });
            return res.text;
        },
        onSuccess: text => {
            setHasPriceAiEverRun(true);
            setPriceAiError(null);
            setPriceAiText(text);
            setIsPriceAiPopoverOpen(true);
        },
        onError: error => {
            setHasPriceAiEverRun(true);
            setPriceAiText(null);
            setPriceAiError(getAiErrorMessage(error));
            setIsPriceAiPopoverOpen(true);
        },
    });

    const [isDescriptionAiPopoverOpen, setIsDescriptionAiPopoverOpen] = useState(false);
    const [descriptionAiText, setDescriptionAiText] = useState<string | null>(null);
    const [descriptionAiError, setDescriptionAiError] = useState<string | null>(null);
    const [hasDescriptionAiEverRun, setHasDescriptionAiEverRun] = useState(false);
    const [descriptionAiBeforeText, setDescriptionAiBeforeText] = useState<string>('');

    const descriptionAiMutation = useMutation({
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
        onSuccess: text => {
            setHasDescriptionAiEverRun(true);
            setDescriptionAiError(null);
            setDescriptionAiText(text);
            setIsDescriptionAiPopoverOpen(true);
        },
        onError: error => {
            setHasDescriptionAiEverRun(true);
            setDescriptionAiText(null);
            setDescriptionAiError(getAiErrorMessage(error));
            setIsDescriptionAiPopoverOpen(true);
        },
    });

    const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
    const [chatDraft, setChatDraft] = useState('');

    const chatMutation = useMutation({
        mutationFn: async (nextMessages: AiChatMessage[]) => {
            const res = await aiChatAboutItem(
                {
                    itemContext: {
                        id,
                        title: form.values.title,
                        category: form.values.category,
                        params: (form.values.params ?? {}) as any,
                        price: form.values.price,
                        description: form.values.description || undefined,
                    },
                    messages: nextMessages,
                },
                undefined,
            );
            return res.text;
        },
        onSuccess: text => {
            setChatMessages(prev => [...prev, { role: 'assistant', content: text }]);
        },
        onError: () => {
            setChatMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        'Произошла ошибка при запросе к AI. Попробуйте повторить вопрос.',
                },
            ]);
        },
    });

    const requiredOk =
        Boolean(form.values.category) &&
        Boolean(form.values.title.trim()) &&
        form.values.price !== null;

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

    return (
        <Container size="xl" pt={30}>
            <Stack gap="md">
                <Title >Редактирование объявления</Title>

                <Stack gap="sm">
                    <Select
                        w={300}
                        label="Категория"
                        data={categoryOptions}
                        allowDeselect={false}
                        withAsterisk
                        value={form.values.category}
                        onChange={value => {
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
                    <Container ml={0} p={0} w={600} >
                        <TextInput
                            label="Название"
                            withAsterisk
                            placeholder="Название"
                            {...form.getInputProps('title')}
                            rightSection={
                                form.values.title ? (
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        aria-label="Очистить"
                                        onClick={() => form.setFieldValue('title', '')}
                                    >
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
                                onChange={value => form.setFieldValue('price', typeof value === 'number' ? value : null)}
                                onBlur={() => form.validateField('price')}
                                error={form.errors.price}
                                rightSection={
                                    form.values.price !== null ? (
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            aria-label="Очистить"
                                            onClick={() => form.setFieldValue('price', null)}
                                        >
                                            <MdOutlineClear size={18} />
                                        </ActionIcon>
                                    ) : null
                                }
                            />
                            <Popover
                                position="bottom-start"
                                withArrow
                                shadow="md"
                                opened={isPriceAiPopoverOpen}
                                onChange={setIsPriceAiPopoverOpen}
                                closeOnClickOutside={false}
                                closeOnEscape={false}
                            >
                                <Popover.Target>
                                    <Button
                                        variant="light"
                                        leftSection={<MdLightbulbOutline size={20} />}
                                        loading={priceAiMutation.isPending}
                                        onClick={() => priceAiMutation.mutate()}
                                    >
                                        {priceAiMutation.isPending
                                            ? 'Выполняется запрос'
                                            : hasPriceAiEverRun
                                                ? 'Повторить запрос'
                                                : 'Узнать рыночную цену'}
                                    </Button>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Stack gap="sm" w={420}>
                                        {priceAiError ? (
                                            <>
                                                <Title order={5} c="red">
                                                    Произошла ошибка при запросе к AI
                                                </Title>
                                                <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {priceAiError}
                                                </Text>
                                                <Group justify="flex-start">
                                                    <Button
                                                        variant="default"
                                                        onClick={() => setIsPriceAiPopoverOpen(false)}
                                                    >
                                                        Закрыть
                                                    </Button>
                                                </Group>
                                            </>
                                        ) : (
                                            <>
                                                <Title order={5}>Ответ AI:</Title>
                                                <Text style={{ whiteSpace: 'pre-wrap' }}>
                                                    {priceAiText ?? ''}
                                                </Text>
                                                <Group justify="flex-start">
                                                    <Button
                                                        onClick={() => {
                                                            const n = parsePriceFromAiText(priceAiText ?? '');
                                                            if (n !== null) form.setFieldValue('price', n);
                                                            setIsPriceAiPopoverOpen(false);
                                                        }}
                                                        disabled={parsePriceFromAiText(priceAiText ?? '') === null}
                                                    >
                                                        Применить
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        onClick={() => setIsPriceAiPopoverOpen(false)}
                                                    >
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
                    <Container ml={0} w={600} p={0} >
                        {form.values.category === ITEM_CATEGORIES.AUTO && (
                            <Stack gap="sm">
                                <Select
                                    label="Коробка передач"
                                    placeholder="Выберите"
                                    clearable
                                    data={[
                                        { value: 'automatic', label: 'Автомат' },
                                        { value: 'manual', label: 'Механика' },
                                    ]}
                                    value={(form.values.params as any).transmission ?? null}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            transmission: (value ?? undefined) as any,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).transmission)}
                                />

                                <TextInput
                                    label="Марка"
                                    placeholder="Марка"
                                    value={(form.values.params as any).brand ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            brand: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).brand ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        brand: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).brand)}
                                />

                                <TextInput
                                    label="Модель"
                                    placeholder="Модель"
                                    value={(form.values.params as any).model ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            model: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).model ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        model: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).model)}
                                />

                                <NumberInput
                                    label="Год выпуска"
                                    placeholder="Год"
                                    hideControls
                                    min={1900}
                                    value={(form.values.params as any).yearOfManufacture ?? undefined}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            yearOfManufacture: typeof value === 'number' ? value : undefined,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).yearOfManufacture)}
                                />

                                <NumberInput
                                    label="Пробег (км)"
                                    placeholder="Пробег"
                                    hideControls
                                    min={0}
                                    value={(form.values.params as any).mileage ?? undefined}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            mileage: typeof value === 'number' ? value : undefined,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).mileage)}
                                />

                                <NumberInput
                                    label="Мощность двигателя (л.с.)"
                                    placeholder="Мощность"
                                    hideControls
                                    min={0}
                                    value={(form.values.params as any).enginePower ?? undefined}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            enginePower: typeof value === 'number' ? value : undefined,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).enginePower)}
                                />
                            </Stack>
                        )}

                        {form.values.category === ITEM_CATEGORIES.REAL_ESTATE && (
                            <Stack gap="sm">
                                <Select
                                    label="Тип"
                                    placeholder="Выберите"
                                    clearable
                                    data={[
                                        { value: 'flat', label: 'Квартира' },
                                        { value: 'house', label: 'Дом' },
                                        { value: 'room', label: 'Комната' },
                                    ]}
                                    value={(form.values.params as any).type ?? null}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            type: (value ?? undefined) as any,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).type)}
                                />

                                <TextInput
                                    label="Адрес"
                                    placeholder="Адрес"
                                    value={(form.values.params as any).address ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            address: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).address ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        address: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).address)}
                                />

                                <NumberInput
                                    label="Площадь (м²)"
                                    placeholder="Площадь"
                                    hideControls
                                    min={0}
                                    value={(form.values.params as any).area ?? undefined}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            area: typeof value === 'number' ? value : undefined,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).area)}
                                />

                                <NumberInput
                                    label="Этаж"
                                    placeholder="Этаж"
                                    hideControls
                                    min={0}
                                    value={(form.values.params as any).floor ?? undefined}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            floor: typeof value === 'number' ? value : undefined,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).floor)}
                                />
                            </Stack>
                        )}

                        {form.values.category === ITEM_CATEGORIES.ELECTRONICS && (
                            <Stack gap="sm">
                                <Select
                                    label="Тип"
                                    placeholder="Выберите"
                                    clearable
                                    data={[
                                        { value: 'phone', label: 'Телефон' },
                                        { value: 'laptop', label: 'Ноутбук' },
                                        { value: 'misc', label: 'Разное' },
                                    ]}
                                    value={(form.values.params as any).type ?? null}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            type: (value ?? undefined) as any,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).type)}
                                />

                                <TextInput
                                    label="Бренд"
                                    placeholder="Бренд"
                                    value={(form.values.params as any).brand ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            brand: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).brand ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        brand: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).brand)}
                                />

                                <TextInput
                                    label="Модель"
                                    placeholder="Модель"
                                    value={(form.values.params as any).model ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            model: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).model ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        model: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).model)}
                                />

                                <Select
                                    label="Состояние"
                                    placeholder="Выберите"
                                    clearable
                                    data={[
                                        { value: 'new', label: 'Новый' },
                                        { value: 'used', label: 'Б/У' },
                                    ]}
                                    value={(form.values.params as any).condition ?? null}
                                    onChange={value =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            condition: (value ?? undefined) as any,
                                        })
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).condition)}
                                />

                                <TextInput
                                    label="Цвет"
                                    placeholder="Цвет"
                                    value={(form.values.params as any).color ?? ''}
                                    onChange={e =>
                                        form.setFieldValue('params', {
                                            ...(form.values.params as any),
                                            color: e.currentTarget.value || undefined,
                                        })
                                    }
                                    rightSection={
                                        (form.values.params as any).color ? (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label="Очистить"
                                                onClick={() =>
                                                    form.setFieldValue('params', {
                                                        ...(form.values.params as any),
                                                        color: undefined,
                                                    })
                                                }
                                            >
                                                <MdOutlineClear size={18} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    styles={maybeWarnIfEmpty(false, (form.values.params as any).color)}
                                />
                            </Stack>
                        )}
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
                        onChange={e => form.setFieldValue('description', e.currentTarget.value)}
                        rightSection={
                            form.values.description ? (
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    aria-label="Очистить"
                                    onClick={() => form.setFieldValue('description', '')}
                                >
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
                        opened={isDescriptionAiPopoverOpen}
                        onChange={setIsDescriptionAiPopoverOpen}
                        closeOnClickOutside={false}
                        closeOnEscape={false}
                    >
                        <Popover.Target>
                            <Button
                                w="min-content"
                                variant="light"
                                leftSection={<MdLightbulbOutline size={20} />}
                                loading={descriptionAiMutation.isPending}
                                onClick={() => descriptionAiMutation.mutate()}
                            >
                                {descriptionAiMutation.isPending
                                    ? 'Выполняется запрос'
                                    : hasDescriptionAiEverRun
                                        ? 'Повторить запрос'
                                        : form.values.description.trim()
                                            ? 'Улучшить описание'
                                            : 'Придумать описание'}
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Stack gap="sm" w={420}>
                                {descriptionAiError ? (
                                    <>
                                        <Title order={5} c="red">
                                            Произошла ошибка при запросе к AI
                                        </Title>
                                        <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                            {descriptionAiError}
                                        </Text>
                                        <Group justify="flex-start">
                                            <Button
                                                variant="default"
                                                onClick={() => setIsDescriptionAiPopoverOpen(false)}
                                            >
                                                Закрыть
                                            </Button>
                                        </Group>
                                    </>
                                ) : (
                                    <>
                                        <Title order={5}>Ответ AI:</Title>
                                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                                            {descriptionAiText ?? ''}
                                        </Text>
                                        {!!descriptionAiText && (
                                            <>
                                                <Divider />
                                                <Group align="flex-start" grow>
                                                    <Stack gap={6}>
                                                        <Text fw={600} size="sm">
                                                            Было
                                                        </Text>
                                                        <Paper withBorder p="sm" radius="md">
                                                            <Text style={{ whiteSpace: 'pre-wrap' }}>
                                                                {descriptionAiBeforeText || '—'}
                                                            </Text>
                                                        </Paper>
                                                    </Stack>
                                                    <Stack gap={6}>
                                                        <Text fw={600} size="sm">
                                                            Стало
                                                        </Text>
                                                        <Paper withBorder p="sm" radius="md">
                                                            <DiffText
                                                                before={descriptionAiBeforeText || ''}
                                                                after={descriptionAiText}
                                                            />
                                                        </Paper>
                                                    </Stack>
                                                </Group>
                                            </>
                                        )}
                                        <Group justify="flex-start">
                                            <Button
                                                onClick={() => {
                                                    form.setFieldValue('description', descriptionAiText ?? '');
                                                    setIsDescriptionAiPopoverOpen(false);
                                                }}
                                                disabled={!descriptionAiText}
                                            >
                                                Применить
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => setIsDescriptionAiPopoverOpen(false)}
                                            >
                                                Закрыть
                                            </Button>
                                        </Group>
                                    </>
                                )}
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>

                </Stack>

                <Divider />

                <Stack gap="sm">
                    <Title order={4}>Чат с AI</Title>
                    <Paper withBorder radius="md" p="md">
                        <Stack gap="sm">
                            <ScrollArea h={220} offsetScrollbars>
                                <Stack gap="xs">
                                    {chatMessages.length === 0 ? (
                                        <Text c="dimmed">
                                            Задайте уточняющий вопрос по этому объявлению — контекст передаётся автоматически.
                                        </Text>
                                    ) : (
                                        chatMessages.map((m, idx) => (
                                            <Group key={idx} justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                                                <Paper
                                                    withBorder
                                                    radius="md"
                                                    p="sm"
                                                    style={{
                                                        maxWidth: 520,
                                                        background:
                                                            m.role === 'user'
                                                                ? 'rgba(34, 139, 230, 0.08)'
                                                                : undefined,
                                                    }}
                                                >
                                                    <Text fw={600} size="xs" c="dimmed" mb={4}>
                                                        {m.role === 'user' ? 'Вы' : 'AI'}
                                                    </Text>
                                                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                                                        {m.content}
                                                    </Text>
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
                                    onChange={e => setChatDraft(e.currentTarget.value)}
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
    );
}