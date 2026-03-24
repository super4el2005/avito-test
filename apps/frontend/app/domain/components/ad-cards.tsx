import { Badge, Card, Group, Stack, Text } from '@mantine/core';

import { memo } from 'react';

import { Link } from 'react-router';

import { CATEGORIES_TRANSLATE } from '../models/constants';
import type { AdResponse } from '../models/types';

import { ImagePlaceholder } from '~/shared/components/image-placeholder';

type AdCardProps = {
  ad: AdResponse;
};

export const AdGridCard = memo(function AdGridCard({ ad }: AdCardProps) {
  return (
    <Card h={300} shadow="sm" padding="lg" radius="md" withBorder component={Link} to={`/ads/${ad.id}`}>
      <Card.Section>
        <ImagePlaceholder h={150} w="100%" />
      </Card.Section>

      <Badge radius="md" variant='default' pos="absolute" top="47%">
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
  );
});

export const AdListCard = memo(function AdListCard({ ad }: AdCardProps) {
  return (
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
  );
});
