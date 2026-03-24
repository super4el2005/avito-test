import {
  Accordion,
  ActionIcon,
  Alert,
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
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { useQuery } from '@tanstack/react-query';

import { useDeferredValue, useMemo, useTransition } from 'react';

import { MdFormatListBulleted, MdGridView, MdInfo, MdOutlineClear, MdSearch } from 'react-icons/md';

import {
  AdsListSearchStateSchema,
  ItemsGetInQuerySchema,
} from '@ads/shared';

import { apiAds } from '~/api';
import { AdGridCard, AdListCard, type AdsResponse, CATEGORIES_FORM, getAdsPlural,LIMIT_ADS, SORT_FORM } from '~/domain';
import { useUiPreference, useUrlSearchState } from '~/shared';

export default function () {
  const searchStateUrl = useUrlSearchState({
    debounceMs: 500,
    fromSearchParams: (params) => ({
      q: AdsListSearchStateSchema.shape.q.parse(params.get('q') ?? ''),
      categories: AdsListSearchStateSchema.shape.categories.parse(params.getAll('categories') ?? []),
      page: AdsListSearchStateSchema.shape.page.catch(1).parse(Number(params.get('page') ?? 1)),
      sort:
        params.get('sort') ??
        `${AdsListSearchStateSchema.shape.sortColumn.parse('createdAt')}:${AdsListSearchStateSchema.shape.sortDirection.parse('desc')}`,
      needsRevision: AdsListSearchStateSchema.shape.needsRevision.parse(params.get('needsRevision') === 'true'),
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
  const sortValue = deferredSearchState.sort || 'createdAt:desc';
  const [sortColumn = 'createdAt', sortDirection = 'asc'] = sortValue.split(':');
  const page = Math.max(1, Number(deferredSearchState.page) || 1);
  const categories = deferredSearchState.categories.join(',');

  const getAdsQuery = useQuery({
    queryKey: ['ads', deferredSearchState],
    queryFn: ({ signal }) => {
      const parsedQuery = ItemsGetInQuerySchema.parse({
        q: deferredSearchState.q,
        categories,
        limit: String(LIMIT_ADS),
        skip: String((page - 1) * LIMIT_ADS),
        needsRevision: String(deferredSearchState.needsRevision),
        sortColumn,
        sortDirection,
      });

      return apiAds.get<AdsResponse>('/items', {
        params: {
          q: parsedQuery.q,
          categories: parsedQuery.categories?.join(','),
          limit: parsedQuery.limit,
          skip: parsedQuery.skip,
          needsRevision: parsedQuery.needsRevision,
          sortColumn: parsedQuery.sortColumn,
          sortDirection: parsedQuery.sortDirection,
        },
        signal,
      });
    },
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
