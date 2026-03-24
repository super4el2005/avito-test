import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Pagination,
  ScrollArea,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { useQuery } from '@tanstack/react-query';

import { memo, useDeferredValue, useMemo, useTransition } from 'react';

import { MdFormatListBulleted, MdGridView, MdInfo, MdOutlineClear, MdSearch } from 'react-icons/md';

import { Link } from 'react-router';

import { type Item, ITEM_CATEGORIES, type ItemSortColumn, type SortDirection } from '@ads/shared';

import { apiAds } from '~/api';
import { ImagePlaceholder } from '~/components/ImagePlaceholder';
import { useUiPreference, useUrlSearchState } from '~/lib';

type Category = (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];
const CATEGORIES_TRANSLATE = {
  [ITEM_CATEGORIES.AUTO]: 'Автомобили',
  [ITEM_CATEGORIES.REAL_ESTATE]: 'Недвижимость',
  [ITEM_CATEGORIES.ELECTRONICS]: 'Электроника',
};

const CATEGORIES_FORM: {
  value: Category;
  label: (typeof CATEGORIES_TRANSLATE)[Category];
}[] = [
  {
    value: ITEM_CATEGORIES.AUTO,
    label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.AUTO],
  },
  {
    value: ITEM_CATEGORIES.REAL_ESTATE,
    label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.REAL_ESTATE],
  },
  {
    value: ITEM_CATEGORIES.ELECTRONICS,
    label: CATEGORIES_TRANSLATE[ITEM_CATEGORIES.ELECTRONICS],
  },
];

type SortFormValue = `${ItemSortColumn}:${SortDirection}`;
const SORT_FORM: {
  value: SortFormValue;
  label: string;
}[] = [
  {
    value: 'createdAt:asc',
    label: 'По новизне (сначала новые)',
  },
  {
    value: 'createdAt:desc',
    label: 'По новизне (сначала старые)',
  },
  {
    value: 'price:asc',
    label: 'По цене (сначала дешевле)',
  },
  {
    value: 'price:desc',
    label: 'По цене (сначала дороже)',
  },
  {
    value: 'title:asc',
    label: 'По названию (А → Я)',
  },
  {
    value: 'title:desc',
    label: 'По названию (Я → А)',
  },
];

type AdResponse = Item & { needsRevision: boolean };
type ResponseAds = {
  total: number;
  items: AdResponse[];
};

const LIMIT_ADS = 10;

const getAdsPlural = (n: number) => {
  const forms = ['объявление', 'объявления', 'объявлений'];
  const num = Math.abs(n) % 100;
  const n1 = num % 10;
  if (num > 10 && num < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
};

type AdCardProps = {
  ad: AdResponse;
};

const AdGridCard = memo(({ ad }: AdCardProps) => (
  <Card h={300} shadow="sm" padding="lg" radius="md" withBorder component={Link} to={`/ads/${ad.id}`}>
    <Card.Section>
      <ImagePlaceholder h={150} w="100%" />
    </Card.Section>

    <Badge radius="md" pos={'absolute'} top={'47%'}>
      {CATEGORIES_TRANSLATE[ad.category]}
    </Badge>
    <Stack gap="xs" mt="md">
      <Text fw={500} lineClamp={2} style={{ minHeight: '48px' }}>
        {ad.title}
      </Text>
      <Text>{ad.price} ₽</Text>

      {ad.needsRevision && (
        <Badge variant="dot" color="orange" w="fit-content">
          Требует доработок
        </Badge>
      )}
    </Stack>
  </Card>
));
AdGridCard.displayName = 'AdGridCard';

const AdListCard = memo(({ ad }: AdCardProps) => (
  <Card h={140} shadow="sm" radius="md" p={0} withBorder component={Link} to={`/ads/${ad.id}`}>
    <Group align="flex-start">
      <ImagePlaceholder w={140} h={140} style={{ display: 'block', flexShrink: 0 }} />

      <Stack m={0} gap={8} pt={5}>
        <Text>{CATEGORIES_TRANSLATE[ad.category]}</Text>
        <Text>{ad.title}</Text>
        <Text>{ad.price} ₽</Text>

        {ad.needsRevision && (
          <Badge variant="dot" color="orange" w="fit-content">
            Требует доработок
          </Badge>
        )}
      </Stack>
    </Group>
  </Card>
));
AdListCard.displayName = 'AdListCard';

export default function () {
  const searchStateUrl = useUrlSearchState({
    debounceMs: 500,
    fromSearchParams: (params) => ({
      q: params.get('q') || '',
      categories: params.getAll('categories') || [],
      page: Number(params.get('page')) || 1,
      sort: params.get('sort') || 'createdAt:asc',
      needsRevision: params.get('needsRevision') === 'true',
    }),
    toSearchParams: (values) => ({
      ...values,
      needsRevision: String(values.needsRevision),
      page: String(values.page),
    }),
  });

  const [viewMode, setViewMode] = useUiPreference<'grid' | 'list'>({
    key: 'view-mode',
    defaultValue: 'grid',
  });
  const [isUiTransitionPending, startUiTransition] = useTransition();

  const deferredSearchState = useDeferredValue(searchStateUrl.values);
  const sortValue = deferredSearchState.sort || 'createdAt:asc';
  const [sortColumn = 'createdAt', sortDirection = 'asc'] = sortValue.split(':');
  const page = Math.max(1, Number(deferredSearchState.page) || 1);
  const categories = deferredSearchState.categories.join(',');

  const getAdsQuery = useQuery({
    queryKey: ['ads', deferredSearchState],
    queryFn: ({ signal }) =>
      apiAds.get<ResponseAds>('/items', {
        params: {
          q: deferredSearchState.q,
          categories,
          limit: LIMIT_ADS,
          skip: (page - 1) * LIMIT_ADS,
          needsRevision: String(deferredSearchState.needsRevision),
          sortColumn,
          sortDirection,
        },
        signal,
      }),
    placeholderData: (previousData) => previousData,
  });

  const form = useForm({
    initialValues: searchStateUrl.values,
    onValuesChange: (values) => {
      startUiTransition(() => {
        searchStateUrl.setValues(values);
      });
    },
  });

  const totalAds = getAdsQuery.data?.data.total ?? 0;
  const totalPagingPages = Math.ceil(totalAds / LIMIT_ADS);
  const ads = useMemo(() => getAdsQuery.data?.data.items ?? [], [getAdsQuery.data?.data.items]);

  const isDataLoading = getAdsQuery.isPlaceholderData || (getAdsQuery.isLoading && !getAdsQuery.data);
  const isFullyForm = form.values.categories.length || form.values.needsRevision || form.values.q;

  return (
    <Container size={'xl'}>
      <Stack>
        <Title>Мои объявления</Title>
        <Title order={2}>
          {getAdsQuery.isLoading ? (
            <Skeleton height={35} width={150} radius="xl" />
          ) : (
            `${getAdsQuery.data?.data.total} ${getAdsPlural(getAdsQuery.data?.data.total || 0)}`
          )}
        </Title>
        <Group>
          <TextInput
            flex={1}
            radius="md"
            placeholder="Найти объявление...."
            rightSection={
              getAdsQuery.isLoading || isUiTransitionPending ? (
                <Loader size={20} />
              ) : form.values.q ? (
                <ActionIcon onClick={() => form.setFieldValue('q', '')} variant="light" color="gray" aria-label="Settings">
                  <MdOutlineClear size={20} />
                </ActionIcon>
              ) : (
                <MdSearch size={20} />
              )
            }
            key={form.key('q')}
            {...form.getInputProps('q')}
          />
          <ActionIcon.Group>
            <ActionIcon
              radius="md"
              onClick={() =>
                startUiTransition(() => {
                  setViewMode('grid');
                })
              }
              variant={viewMode === 'grid' ? 'outline' : 'default'}
              size="lg"
              aria-label="Gallery"
            >
              <MdGridView size={20} />
            </ActionIcon>

            <ActionIcon
              radius="md"
              onClick={() =>
                startUiTransition(() => {
                  setViewMode('list');
                })
              }
              variant={viewMode === 'list' ? 'outline' : 'default'}
              size="lg"
              aria-label="Settings"
            >
              <MdFormatListBulleted size={20} />
            </ActionIcon>
          </ActionIcon.Group>
          <Select w={260} radius="md" key={form.key('sort')} {...form.getInputProps('sort')} data={SORT_FORM} allowDeselect={false} />
        </Group>
        <Group align="flex-start">
          <Stack w={200}>
            <Title order={3}>Фильтры</Title>
            <Accordion defaultValue="category">
              <Accordion.Item value={'category'}>
                <Accordion.Control>Категория</Accordion.Control>
                <Accordion.Panel>
                  <Checkbox.Group key={form.key('categories')} {...form.getInputProps('categories')}>
                    <Stack mt="xs">
                      {CATEGORIES_FORM.map((category) => (
                        <Checkbox key={category.value} value={category.value} label={category.label} />
                      ))}
                    </Stack>
                  </Checkbox.Group>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
            <Switch
              key={form.key('needsRevision')}
              {...form.getInputProps('needsRevision', { type: 'checkbox' })}
              label="Только требующие доработок"
            />
            <Button
              disabled={!isFullyForm}
              onClick={() =>
                startUiTransition(() => {
                  form.setValues({
                    q: '',
                    categories: [],
                    needsRevision: false,
                  });
                })
              }
            >
              Сбросить фильтры
            </Button>
          </Stack>
          <Stack flex={1}>
            {!getAdsQuery.data?.data.items.length && !getAdsQuery.isLoading && <Alert icon={<MdInfo />} title="Ничего не найдено"></Alert>}
            {getAdsQuery.isError && <Alert color="red" icon={<MdInfo />} title="Ошибка"></Alert>}
            {viewMode === 'grid' && (
              <SimpleGrid cols={5} h={650}>
                {!isDataLoading && !!ads.length && ads.map((ad) => <AdGridCard key={ad.id} ad={ad} />)}
                {isDataLoading &&
                  [...new Array(LIMIT_ADS)].map((_, id) => (
                    <Card key={id} h={320} shadow="sm" padding="lg" radius="md" withBorder>
                      <Card.Section>
                        <Skeleton height={150} />
                      </Card.Section>
                      <Skeleton height={50} mt={20} />
                      <Skeleton height={28} width="50%" mt="auto" mb={10} />
                      <Skeleton height={24} radius="md" />
                    </Card>
                  ))}
              </SimpleGrid>
            )}
            {viewMode === 'list' && (
              <ScrollArea h={650}>
                <Stack>
                  {!isDataLoading && !!ads.length && ads.map((ad) => <AdListCard key={ad.id} ad={ad} />)}
                  {isDataLoading &&
                    [...new Array(LIMIT_ADS)].map((_, id) => (
                      <Card key={id} h={140} shadow="sm" radius="md" p={0} withBorder>
                        <Group align="flex-start" wrap="nowrap">
                          <Skeleton height={140} width={140} radius={0} />
                          <Stack m={0} gap={8} pt={5} pr={10} flex={1}>
                            <Skeleton height={20} width="10%" radius="xl" />
                            <Skeleton height={20} width="50%" radius="xl" />
                            <Skeleton height={20} width="10%" radius="xl" mt={4} />
                            <Skeleton height={20} width={120} radius="xl" mt={5} />
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                </Stack>
              </ScrollArea>
            )}
            <Pagination
              key={form.key('page')}
              {...form.getInputProps('page')}
              total={totalPagingPages}
              disabled={getAdsQuery.isPending && !getAdsQuery.data}
            />
          </Stack>
        </Group>
      </Stack>
    </Container>
  );
}
