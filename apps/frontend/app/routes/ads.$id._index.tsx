import { Alert, Button, Container, Divider, Group, List, Skeleton, Stack, Text, Title } from '@mantine/core';

import { useQuery } from '@tanstack/react-query';

import { MdArrowBack, MdEdit, MdInfo } from 'react-icons/md';

import { Link, useParams } from 'react-router';

import { ITEM_CATEGORIES, type Item } from '@ads/shared';

import { apiAds } from '~/api';
import { ImagePlaceholder } from '~/components/ImagePlaceholder';
import { extractErrorMessage, translateByMap } from '~/lib';

type ItemDetailsResponse = Item & {
  needsRevision: boolean;
  missingParams: string[];
};

const PARAM_LABEL_TRANSLATIONS: Record<string, string> = {
  // Характеристики для Auto
  brand: 'Марка',
  model: 'Модель',
  yearOfManufacture: 'Год выпуска',
  transmission: 'Коробка передач',
  mileage: 'Пробег (км)',
  enginePower: 'Мощность двигателя (л.с.)',

  // Общий label для type (будет переопределен по категории)
  type: 'Тип',
  address: 'Адрес',
  area: 'Площадь (м²)',
  floor: 'Этаж',

  // Характеристики для Electronics
  condition: 'Состояние',
  color: 'Цвет',
};

const PARAM_VALUE_TRANSLATIONS: Record<string, string> = {
  // Значения для transmission
  automatic: 'Автомат',
  manual: 'Механика',

  // Значения для condition
  new: 'Новый',
  used: 'Б/У',
};

const TYPE_VALUE_TRANSLATIONS_BY_CATEGORY: Record<string, Record<string, string>> = {
  [ITEM_CATEGORIES.REAL_ESTATE]: {
    flat: 'Квартира',
    house: 'Дом',
    room: 'Комната',
  },
  [ITEM_CATEGORIES.ELECTRONICS]: {
    phone: 'Телефон',
    laptop: 'Ноутбук',
    misc: 'Разное',
  },
};

const TYPE_LABEL_TRANSLATIONS_BY_CATEGORY: Record<string, string> = {
  [ITEM_CATEGORIES.REAL_ESTATE]: 'Тип недвижимости',
  [ITEM_CATEGORIES.ELECTRONICS]: 'Тип',
};

const DATE_TIME_FORMATTER_RU = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const formatDateTimeRu = (value?: string): string => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const parts = DATE_TIME_FORMATTER_RU.formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  if (!day || !month || !hour || !minute) return '-';
  return `${day} ${month} ${hour}:${minute}`;
};

const translateParamLabel = (key: string, category?: Item['category']): string => {
  if (key === 'type' && category) {
    return TYPE_LABEL_TRANSLATIONS_BY_CATEGORY[category] ?? PARAM_LABEL_TRANSLATIONS.type;
  }

  return translateByMap(key, PARAM_LABEL_TRANSLATIONS);
};

const translateParamValue = (key: string, value: unknown, category?: Item['category']): string => {
  const valueKey = String(value);

  if (key === 'type' && category) {
    return translateByMap(valueKey, TYPE_VALUE_TRANSLATIONS_BY_CATEGORY[category] ?? {});
  }

  return translateByMap(valueKey, PARAM_VALUE_TRANSLATIONS);
};

export default function () {
  const params = useParams();
  const getAdQuery = useQuery({
    queryKey: ['ad', params.id],
    queryFn: ({ signal }) =>
      apiAds.get<ItemDetailsResponse>(`/items/${params.id}`, {
        signal,
      }),
  });
  if (getAdQuery.isError) {
    const errorMessage = extractErrorMessage(getAdQuery.error, 'Не удалось загрузить объявление');

    return (
      <Container>
        <Stack pt={30}>
          <Alert color="red" title="Ошибка">
            {errorMessage}
          </Alert>
          <Button component={Link} to="/ads">
            На главную
          </Button>
        </Stack>
      </Container>
    );
  }
  if (getAdQuery.isLoading) {
    return (
      <Container size="xl" pt={30}>
        <Stack gap="md">
          <Group justify="space-between">
            <Skeleton h={36} w="55%" />
            <Skeleton h={36} w={140} />
          </Group>

          <Group mt={12} justify="space-between">
            <Group>
              <Skeleton h={36} w={110} />
              <Skeleton h={36} w={150} />
            </Group>
            <Stack gap={6} align="flex-end">
              <Skeleton h={16} w={170} />
              <Skeleton h={16} w={170} />
            </Stack>
          </Group>

          <Divider my="md" />

          <Group align="flex-start">
            <Skeleton h={360} w={480} />
            <Stack w={500} gap="sm">
              <Skeleton h={32} w="60%" />
              <Skeleton h={22} w="75%" />
              <Skeleton h={22} w="70%" />
              <Skeleton h={22} w="65%" />
            </Stack>
          </Group>
        </Stack>
      </Container>
    );
  }
  return (
    <Container size={'xl'} pt={30}>
      <Group justify="space-between">
        <Title order={3}>{getAdQuery.data?.data.title}</Title>
        <Title order={3}>{getAdQuery.data?.data.price}</Title>
      </Group>

      <Group mt={12} justify="space-between">
        <Group>
          <Button leftSection={<MdArrowBack size={20} />} variant="light" component={Link} to="/ads">
            Назад
          </Button>
          <Button component={Link} to={`/ads/${params.id}/edit`} rightSection={<MdEdit />}>
            Редактировать
          </Button>
        </Group>
        <Stack gap={4} align="flex-end">
          <Text c="dimmed">Опубликовано: {formatDateTimeRu(getAdQuery.data?.data.createdAt)}</Text>
          <Text c="dimmed">Отредактировано: {formatDateTimeRu(getAdQuery.data?.data.updatedAt)}</Text>
        </Stack>
      </Group>
      <Divider my="md" />

      <Group align="flex-start">
        <Stack>
          <ImagePlaceholder w={480} h={360} iconSize={80} />
          <Group justify="space-between">
            {[...new Array(4)].map((_, index) => (
              <ImagePlaceholder key={index} w={100} h={70} iconSize={28} />
            ))}
          </Group>
        </Stack>
        <Stack w={500}>
          {getAdQuery.data?.data.needsRevision && (
            <Alert radius={'md'} color="yellow" icon={<MdInfo />} title={'Требуются доработки'}>
              <List listStyleType="none">
                <List.Item>
                  У объявления не заполнены поля:
                  <List withPadding listStyleType="disc">
                    {getAdQuery.data?.data.missingParams.length ? (
                      getAdQuery.data?.data.missingParams.map((param) => (
                        <List.Item key={param}>{translateParamLabel(param, getAdQuery.data?.data.category)}</List.Item>
                      ))
                    ) : (
                      <List.Item>Не заполнено описание</List.Item>
                    )}
                  </List>
                </List.Item>
              </List>
            </Alert>
          )}

          <Title order={4}>Характеристики</Title>
          {Object.keys(getAdQuery.data?.data.params ?? {}).length > 0 ? (
            <Stack gap={1}>
              {Object.entries(getAdQuery.data?.data.params ?? {})
                .filter(([key]) => PARAM_LABEL_TRANSLATIONS[key])
                .map(([key, value]) => (
                  <Group key={key}>
                    <Text fw={500} w={200}>
                      {translateParamLabel(key, getAdQuery.data?.data.category)}
                    </Text>
                    <Text>{translateParamValue(key, value, getAdQuery.data?.data.category)}</Text>
                  </Group>
                ))}
            </Stack>
          ) : (
            <Text c="dimmed">Отсутствуют</Text>
          )}
        </Stack>
      </Group>
      <Title order={3} my={10}>
        Описание
      </Title>
      {getAdQuery.data?.data.description ? <Text w={480}>{getAdQuery.data?.data.description}</Text> : <Text c="dimmed">Отсутствует</Text>}
    </Container>
  );
}
