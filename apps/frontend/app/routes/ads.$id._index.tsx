import { Alert, Button, Container, Divider, Group, List, ScrollArea, Skeleton, Stack, Text, Title } from '@mantine/core';

import { useQuery } from '@tanstack/react-query';

import { useMemo } from 'react';

import { MdArrowBack, MdEdit, MdInfo } from 'react-icons/md';

import { Link, useParams } from 'react-router';

import { apiAds } from '~/api';
import { buildAdDetailsParamsViewModel, formatDateTimeRu, type ItemDetailsResponse, translateParamLabel, translateParamValue } from '~/domain';
import { extractErrorMessage } from '~/shared';
import { ImagePlaceholder } from '~/shared/components/image-placeholder';

export default function () {
  const params = useParams();
  const id = params.id ?? '';
  const getAdQuery = useQuery({
    queryKey: ['ad', id],
    queryFn: ({ signal }) =>
      apiAds.get<ItemDetailsResponse>(`/items/${id}`, {
        signal,
      }),
    enabled: Boolean(id),
  });

  const ad = getAdQuery.data?.data;
  const adDetailsView = useMemo(() => buildAdDetailsParamsViewModel(ad), [ad]);

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
        <Title order={3}>{ad?.title}</Title>
        <Title order={3}>{ad?.price} ₽</Title>
      </Group>

      <Group mt={12} justify="space-between">
        <Group>
          <Button leftSection={<MdArrowBack size={20} />} variant="light" component={Link} to="/ads">
            Назад
          </Button>
          <Button component={Link} to={`/ads/${id}/edit`} rightSection={<MdEdit />}>
            Редактировать
          </Button>
        </Group>
        <Stack gap={4} align="flex-end">
          <Text c="dimmed">Опубликовано: {formatDateTimeRu(ad?.createdAt)}</Text>
          <Text c="dimmed">Отредактировано: {formatDateTimeRu(ad?.updatedAt)}</Text>
        </Stack>
      </Group>
      <Divider my="md" />

      <Group align="flex-start">
        <Stack>
          <ImagePlaceholder w={480} h={360} iconSize={80} />
          <ScrollArea w={480} h={85}>
            <Group w="max-content">
              {[...new Array(6)].map((_, index) => (
                <ImagePlaceholder key={index} w={100} h={70} iconSize={28} />
              ))}
            </Group>
          </ScrollArea>
        </Stack>
        <Stack w={"max-content"} align="flex-start">
          {ad?.needsRevision && (
            <Alert radius={'md'} color="yellow" icon={<MdInfo />} title={'Требуются доработки'}>
              <List listStyleType="none">
                <List.Item>
                  У объявления не заполнены поля:
                  <List withPadding listStyleType="disc">
                    {adDetailsView.missingParamLabels.map((label) => (
                      <List.Item key={label}>{label}</List.Item>
                    ))}
                  </List>
                </List.Item>
              </List>
            </Alert>
          )}

          <Title order={4}>Характеристики</Title>
          {adDetailsView.hasParams ? (
            <Stack gap={1}>
              {adDetailsView.translatedParams.map(({ key, value }) => (
                <Group key={key} wrap="nowrap" gap="xs">
                  <Text fw={500} w={200} flex="0 0 auto">
                    {translateParamLabel(key, ad?.category)}
                  </Text>
                  <Text
                    flex={1}
                    style={{ textAlign: 'right' }}
                  >
                    {translateParamValue(key, value, ad?.category)}
                  </Text>
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
      {ad?.description ? <Text w={480}>{ad.description}</Text> : <Text c="dimmed">Отсутствует</Text>}
    </Container>
  );
}
