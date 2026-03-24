import { Card, Group, Skeleton, Stack } from '@mantine/core';

import { LIMIT_ADS } from '../models/constants';

export function AdGridSkeletonCard() {
  return (
    <Card h={320} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Skeleton height={150} />
      </Card.Section>
      <Skeleton height={50} mt={20} />
      <Skeleton height={28} width="50%" mt="auto" mb={10} />
      <Skeleton height={24} radius="md" />
    </Card>
  );
}

export function AdListSkeletonCard() {
  return (
    <Card h={140} shadow="sm" radius="md" p={0} withBorder>
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
  );
}

export function buildLoadingSkeletonKeys() {
  return Array.from({ length: LIMIT_ADS }, (_, index) => index);
}
