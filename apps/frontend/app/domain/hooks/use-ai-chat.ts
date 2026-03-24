import { useMutation } from '@tanstack/react-query';

import { useCallback, useMemo, useState } from 'react';

import { aiChatAboutItem, type AiChatAboutItemInput, type AiChatMessage } from '~/api';

import { buildAiChatRequest } from '../models/ai-mappers';

export type ChatMessage = AiChatMessage & { id: string };

const CHAT_ERROR_MESSAGE = 'Произошла ошибка при запросе к AI. Попробуйте повторить вопрос.';

export function useAiChat(itemContext: AiChatAboutItemInput['itemContext']) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');

  const messageHistory = useMemo<AiChatMessage[]>(
    () => chatMessages.map(({ role, content }) => ({ role, content })),
    [chatMessages],
  );

  const chatMutation = useMutation({
    mutationFn: async (nextMessages: AiChatMessage[]) => {
      const res = await aiChatAboutItem(buildAiChatRequest(itemContext, nextMessages), undefined);
      return res.text;
    },
    onSuccess: (text) => {
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
    },
    onError: () => {
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: CHAT_ERROR_MESSAGE }]);
    },
  });

  const sendMessage = useCallback(() => {
    const trimmed = chatDraft.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate([...messageHistory, { role: userMessage.role, content: userMessage.content }]);
    setChatDraft('');
  }, [chatDraft, chatMutation, messageHistory]);

  return {
    chatMessages,
    chatDraft,
    setChatDraft,
    isPending: chatMutation.isPending,
    sendMessage,
  };
}
