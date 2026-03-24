import { Link, useParams } from 'react-router';

import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  List,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { MdArrowBack, MdEdit, MdInfo } from 'react-icons/md';

import type { Item } from '@ads/shared';

import { apiAds } from '~/api';

type ItemDetailsResponse = Item & {
  needsRevision: boolean;
  missingParams: string[];
};

const PARAM_TRANSLATIONS: Record<string, string> = {
  // Характеристики для Auto
  brand: 'Марка',
  model: 'Модель',
  yearOfManufacture: 'Год выпуска',
  transmission: 'Коробка передач',
  mileage: 'Пробег (км)',
  enginePower: 'Мощность двигателя (л.с.)',

  // Значения для transmission
  automatic: 'Автомат',
  manual: 'Механика',

  // Характеристики для RealEstate
  type: 'Тип недвижимости',
  address: 'Адрес',
  area: 'Площадь (м²)',
  floor: 'Этаж',

  // Значения для type (real estate)
  flat: 'Квартира',
  house: 'Дом',
  room: 'Комната',

  // Характеристики для Electronics
  condition: 'Состояние',
  color: 'Цвет',

  // Значения для type (electronics)
  phone: 'Телефон',
  laptop: 'Ноутбук',
  misc: 'Разное',

  // Значения для condition
  new: 'Новый',
  used: 'Б/У',
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
    'error' in error.response.data &&
    typeof error.response.data.error === 'string'
  ) {
    return error.response.data.error;
  }

  return 'Не удалось загрузить объявление';
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
    const errorMessage = getBackendErrorMessage(getAdQuery.error);

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
          <Button
            leftSection={<MdArrowBack size={20} />}
            variant="light"
            component={Link}
            to="/ads"
          >
            Назад
          </Button>
          <Button component={Link} to={`/ads/${params.id}/edit`} rightSection={<MdEdit />}>
            Редактировать
          </Button>
        </Group>
        <Stack gap={4} align="flex-end">
          <Text c="dimmed">Опубликовано: 10 марта 22:39</Text>
          <Text c="dimmed">Отредактировано: 10 марта 23:12</Text>
        </Stack>
      </Group>
      <Divider my="md" />

      <Group align="flex-start">
        <Stack>
          <img
            width={480}
            height={360}
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE7Ui111Q0ppxCJctMroRHTZyzWKB28EV8sg&s"
            alt=""
            style={{ objectFit: 'cover' }}
          />
          <Group justify="space-between">
            {[...new Array(4)].map((_, index) => (
              <img
                key={index}
                width={100}
                height={70}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE7Ui111Q0ppxCJctMroRHTZyzWKB28EV8sg&s"
                alt=""
                style={{ objectFit: 'cover' }}
              />
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
                        <List.Item key={param}>{PARAM_TRANSLATIONS[param] ?? param}</List.Item>
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
                .filter(([key]) => PARAM_TRANSLATIONS[key])
                .map(([key, value]) => (
                  <Group key={key}>
                    <Text fw={500} w={200}>
                      {PARAM_TRANSLATIONS[key] || key}
                    </Text>
                    <Text>{PARAM_TRANSLATIONS[value] || value}</Text>
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
      {getAdQuery.data?.data.description ? (
        <Text w={480}>{getAdQuery.data?.data.description}</Text>
      ) : (
        <Text c="dimmed">Отсутствует</Text>
      )}
    </Container>
  );
}
