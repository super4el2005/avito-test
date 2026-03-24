import { ActionIcon, Button, Group, Paper, Popover, ScrollArea, Stack, Text, Textarea, Title } from '@mantine/core';

import { useDisclosure } from '@mantine/hooks';

import { useMutation } from '@tanstack/react-query';

import { diffWordsWithSpace } from 'diff';

import { memo, type ReactNode, useMemo, useState } from 'react';

import { MdChatBubbleOutline, MdLightbulbOutline, MdOutlineClear } from 'react-icons/md';

import type { AiChatMessage } from '~/api';
import { aiChatAboutItem } from '~/api';

import type { Category } from '../models/types';

export const AI_REQUEST_ERROR_MESSAGE = 'Произошла ошибка при запросе к AI\nПопробуйте повторить запрос или закройте уведомление';

export type ChatContextRef = {
  id: string;
  title: string;
  category: Category;
  params: unknown;
  price: number | null;
  description?: string;
};

export const DiffText = memo(function DiffText({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWordsWithSpace(before ?? '', after ?? ''), [before, after]);
  return (
    <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
      {parts.map((part, idx) => {
        const bg = part.added ? 'rgba(64, 192, 87, 0.18)' : part.removed ? 'rgba(250, 82, 82, 0.16)' : undefined;
        const decoration = part.removed ? 'line-through' : undefined;
        return (
          <Text
            key={idx}
            span
            style={{
              background: bg,
              textDecoration: decoration,
            }}
          >
            {part.value}
          </Text>
        );
      })}
    </Text>
  );
});

export const AiPopoverError = memo(function AiPopoverError({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <Title order={5} c="red">
        Произошла ошибка при запросе к AI
      </Title>
      <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
        {message}
      </Text>
      <Group justify="flex-start">
        <Button variant="default" onClick={onClose}>
          Закрыть
        </Button>
      </Group>
    </>
  );
});

export const AiPopoverActions = memo(function AiPopoverActions({
  onApply,
  onClose,
  isApplyDisabled,
}: {
  onApply: () => void;
  onClose: () => void;
  isApplyDisabled?: boolean;
}) {
  return (
    <Group justify="flex-start">
      <Button onClick={onApply} disabled={isApplyDisabled}>
        Применить
      </Button>
      <Button variant="default" onClick={onClose}>
        Закрыть
      </Button>
    </Group>
  );
});

export const AiSuggestionPopover = memo(function AiSuggestionPopover({
  isOpen,
  setIsOpen,
  isPending,
  hasEverRun,
  onRun,
  buttonLabel,
  buttonWidth,
  children,
}: {
  isOpen: boolean;
  setIsOpen: (next: boolean) => void;
  isPending: boolean;
  hasEverRun: boolean;
  onRun: () => void;
  buttonLabel: string;
  buttonWidth?: string;
  children: ReactNode;
}) {
  return (
    <Popover
      position="bottom-start"
      withArrow
      shadow="md"
      opened={isOpen}
      onChange={setIsOpen}
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Popover.Target>
        <Button w={buttonWidth} variant="light" leftSection={<MdLightbulbOutline size={20} />} loading={isPending} onClick={onRun}>
          {isPending ? 'Выполняется запрос' : hasEverRun ? 'Повторить запрос' : buttonLabel}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm" w={420}>
          {children}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
});

export const AiChatWidget = memo(function AiChatWidget({ itemContext }: { itemContext: ChatContextRef }) {
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useDisclosure(false);

  const chatMutation = useMutation({
    mutationFn: async (nextMessages: AiChatMessage[]) => {
      const res = await aiChatAboutItem(
        {
          itemContext: {
            id: itemContext.id,
            title: itemContext.title,
            category: itemContext.category,
            params: itemContext.params as Record<string, unknown>,
            price: itemContext.price,
            description: itemContext.description,
          },
          messages: nextMessages,
        },
        undefined,
      );
      return res.text;
    },
    onSuccess: (text) => {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Произошла ошибка при запросе к AI. Попробуйте повторить вопрос.',
        },
      ]);
    },
  });

  return (
    <Popover
      position="top-end"
      withArrow
      shadow="md"
      opened={isChatWidgetOpen}
      onChange={(opened) => {
        if (opened) {
          setIsChatWidgetOpen.open();
          return;
        }
        setIsChatWidgetOpen.close();
      }}
      closeOnClickOutside
      closeOnEscape
    >
      <Popover.Target>
        <ActionIcon
          onClick={() => setIsChatWidgetOpen.open()}
          variant="filled"
          size={52}
          radius={999}
          aria-label="Открыть чат с AI"
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 3000 }}
        >
          <MdChatBubbleOutline size={22} />
        </ActionIcon>
      </Popover.Target>
      {isChatWidgetOpen && (
        <Popover.Dropdown>
          <Stack gap="sm" w={420}>
            <Group justify="space-between" align="center">
              <Title order={5}>Чат с AI</Title>
              <ActionIcon variant="subtle" color="gray" aria-label="Закрыть чат" onClick={() => setIsChatWidgetOpen.close()}>
                <MdOutlineClear size={18} />
              </ActionIcon>
            </Group>
            <Paper withBorder radius="md" p="sm">
              <Stack gap="sm">
                <ScrollArea h={260} offsetScrollbars>
                  <Stack gap="xs">
                    {chatMessages.length === 0 ? (
                      <Text c="dimmed">Задайте уточняющий вопрос по этому объявлению — контекст передаётся автоматически.</Text>
                    ) : (
                      chatMessages.map((m, idx) => (
                        <Group key={idx} justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                          <Paper
                            withBorder
                            radius="md"
                            p="sm"
                            style={{
                              maxWidth: 320,
                              background: m.role === 'user' ? 'rgba(34, 139, 230, 0.08)' : undefined,
                            }}
                          >
                            <Text fw={600} size="xs" c="dimmed" mb={4}>
                              {m.role === 'user' ? 'Вы' : 'AI'}
                            </Text>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
                          </Paper>
                        </Group>
                      ))
                    )}
                  </Stack>
                </ScrollArea>

                <Group align="flex-end" wrap="nowrap">
                  <Textarea
                    flex={1}
                    placeholder="Ваш вопрос…"
                    minRows={2}
                    autosize
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.currentTarget.value)}
                  />
                  <Button
                    loading={chatMutation.isPending}
                    disabled={!chatDraft.trim()}
                    onClick={() => {
                      const userMessage: AiChatMessage = {
                        role: 'user',
                        content: chatDraft.trim(),
                      };
                      const next = [...chatMessages, userMessage];
                      setChatMessages(next);
                      setChatDraft('');
                      chatMutation.mutate(next);
                    }}
                  >
                    Отправить
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Popover.Dropdown>
      )}
    </Popover>
  );
});
