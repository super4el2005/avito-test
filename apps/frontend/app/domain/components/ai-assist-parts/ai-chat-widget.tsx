import { ActionIcon, Button, Group, Paper, Popover, ScrollArea, Stack, Textarea, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { memo } from 'react';

import { MdChatBubbleOutline, MdOutlineClear } from 'react-icons/md';

import { useAiChat } from '../../hooks/use-ai-chat';

import { AiChatMessagesList } from './ai-chat-messages-list';
import type { ChatContextRef } from './chat-context-types';

export type AiChatWidgetProps = {
  itemContext: ChatContextRef;
};

export const AiChatWidget = memo(function AiChatWidget({ itemContext }: AiChatWidgetProps) {
  const [isChatWidgetOpen, { open: openChatWidget, close: closeChatWidget }] = useDisclosure(false);
  const chat = useAiChat(itemContext);

  return (
    <Popover
      position="top-end"
      withArrow
      shadow="md"
      opened={isChatWidgetOpen}
      onChange={(opened) => (opened ? openChatWidget() : closeChatWidget())}
      closeOnClickOutside
      closeOnEscape
    >
      <Popover.Target>
        <ActionIcon
          onClick={() => openChatWidget()}
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
              <ActionIcon variant="subtle" color="gray" aria-label="Закрыть чат" onClick={() => closeChatWidget()}>
                <MdOutlineClear size={18} />
              </ActionIcon>
            </Group>
            <Paper withBorder radius="md" p="sm">
              <Stack gap="sm">
                <ScrollArea h={260} offsetScrollbars>
                  <AiChatMessagesList messages={chat.chatMessages} />
                </ScrollArea>

                <Group align="flex-end" wrap="nowrap">
                  <Textarea
                    flex={1}
                    placeholder="Ваш вопрос…"
                    minRows={2}
                    autosize
                    value={chat.chatDraft}
                    onChange={(e) => chat.setChatDraft(e.currentTarget.value)}
                  />
                  <Button loading={chat.isPending} disabled={!chat.chatDraft.trim()} onClick={chat.sendMessage}>
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
