import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core';

import { useQuery } from '@tanstack/react-query';

import { MdInfo } from 'react-icons/md';

import { Link, useParams } from 'react-router';

import { apiAds } from '~/api';
import { AdsEditForm, type ItemDetailsResponse } from '~/domain';

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
