import { Group, Paper, Stack, Text } from '@mantine/core';

import { memo } from 'react';

import type { ChatMessage } from '../../hooks/use-ai-chat';

export type AiChatMessagesListProps = {
  messages: readonly ChatMessage[];
};

export const AiChatMessagesList = memo(function AiChatMessagesList({ messages }: AiChatMessagesListProps) {
  if (messages.length === 0) {
    return (
      <Stack gap="xs">
        <Text c="dimmed">Задайте уточняющий вопрос по этому объявлению — контекст передаётся автоматически.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      {messages.map((message) => (
        <Group key={message.id} justify={message.role === 'user' ? 'flex-end' : 'flex-start'}>
          <Paper
            withBorder
            radius="md"
            p="sm"
            style={{
              maxWidth: 320,
              background: message.role === 'user' ? 'rgba(34, 139, 230, 0.08)' : undefined,
            }}
          >
            <Text fw={600} size="xs" c="dimmed" mb={4}>
              {message.role === 'user' ? 'Вы' : 'AI'}
            </Text>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
          </Paper>
        </Group>
      ))}
    </Stack>
  );
});
