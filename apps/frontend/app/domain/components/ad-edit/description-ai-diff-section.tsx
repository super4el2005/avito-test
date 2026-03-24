import { Divider, Group, Paper, Stack, Text } from '@mantine/core';

import { lazy, Suspense } from 'react';

const DiffTextLazy = lazy(async () => {
  const module = await import('../diff-text');
  return { default: module.DiffText };
});

export type DescriptionAiDiffSectionProps = {
  beforeText: string;
  afterText: string;
};

export function DescriptionAiDiffSection({ beforeText, afterText }: DescriptionAiDiffSectionProps) {
  return (
    <>
      <Divider />
      <Group align="flex-start" grow>
        <Stack gap={6}>
          <Text fw={600} size="sm">
            Было
          </Text>
          <Paper withBorder p="sm" radius="md">
            <Text style={{ whiteSpace: 'pre-wrap' }}>{beforeText || '—'}</Text>
          </Paper>
        </Stack>
        <Stack gap={6}>
          <Text fw={600} size="sm">
            Стало
          </Text>
          <Paper withBorder p="sm" radius="md">
            <Suspense fallback={<Text c="dimmed">Сравниваем...</Text>}>
              <DiffTextLazy before={beforeText} after={afterText} />
            </Suspense>
          </Paper>
        </Stack>
      </Group>
    </>
  );
}
