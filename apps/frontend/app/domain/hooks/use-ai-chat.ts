import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildAiChatRequest } from '../models/ai-mappers';

import { aiChatAboutItem, type AiChatAboutItemInput, type AiChatMessage } from '~/api';

export type ChatMessage = AiChatMessage & { id: string };

const CHAT_ERROR_MESSAGE = 'Произошла ошибка при запросе к AI. Попробуйте повторить вопрос.';

function isRequestAbortedError(error: unknown): boolean {
  if (isAxiosError(error) && error.code === 'ERR_CANCELED') {
    return true;
  }
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useAiChat(itemContext: AiChatAboutItemInput['itemContext']) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      chatAbortRef.current = null;
    };
  }, []);

  const messageHistory = useMemo<AiChatMessage[]>(
    () => chatMessages.map(({ role, content }) => ({ role, content })),
    [chatMessages],
  );

  const chatMutation = useMutation({
    mutationFn: async (nextMessages: AiChatMessage[]) => {
      chatAbortRef.current?.abort();
      const controller = new AbortController();
      chatAbortRef.current = controller;
      const res = await aiChatAboutItem(buildAiChatRequest(itemContext, nextMessages), controller.signal);
      return res.text;
    },
    onSuccess: (text) => {
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
    },
    onError: (error) => {
      if (isRequestAbortedError(error)) {
        return;
      }
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
