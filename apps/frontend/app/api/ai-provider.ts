import { apiAds, apiOllama } from './axios-instances';

const OLLAMA_MODEL = 'llama3.1';
const GIGACHAT_MODEL = 'GigaChat-2';
const AI_PROVIDER = (import.meta.env.VITE_AI_PROVIDER ?? 'ollama').toLowerCase();

type TextCarrierPayload = {
  response?: unknown;
  message?: { content?: unknown };
  choices?: Array<{ message?: { content?: unknown } }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTextCarrierPayload(value: unknown): value is TextCarrierPayload {
  if (!isRecord(value)) {
    return false;
  }

  return 'response' in value || 'message' in value || 'choices' in value;
}

function extractText(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!isTextCarrierPayload(payload)) {
    return JSON.stringify(payload);
  }

  if (typeof payload.message?.content === 'string') {
    return payload.message.content;
  }

  if (typeof payload.response === 'string') {
    return payload.response;
  }

  if (typeof payload.choices?.[0]?.message?.content === 'string') {
    return payload.choices[0].message.content;
  }

  return JSON.stringify(payload);
}

type AiProvider = 'ollama' | 'gigachat';

function getAiProvider(): AiProvider {
  return AI_PROVIDER === 'gigachat' ? 'gigachat' : 'ollama';
}

export type AiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type RequestPromptParams = { prompt: string; signal?: AbortSignal };
type RequestChatParams = { system: string; messages: AiChatMessage[]; signal?: AbortSignal };

const providerRequestHandlers: Record<
  AiProvider,
  {
    requestPrompt: (params: RequestPromptParams) => Promise<string>;
    requestChat: (params: RequestChatParams) => Promise<string>;
  }
> = {
  ollama: {
    requestPrompt: async ({ prompt, signal }) => {
      const res = await apiOllama.post(
        '/api/generate',
        {
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
        },
        { signal },
      );

      return extractText(res.data);
    },
    requestChat: async ({ system, messages, signal }) => {
      const res = await apiOllama.post(
        '/api/chat',
        {
          model: OLLAMA_MODEL,
          stream: false,
          messages: [{ role: 'system', content: system }, ...messages],
        },
        { signal },
      );

      return extractText(res.data);
    },
  },
  gigachat: {
    requestPrompt: async ({ prompt, signal }) => {
      const res = await apiAds.post(
        '/ai/gigachat/chat',
        {
          model: GIGACHAT_MODEL,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal },
      );

      return extractText(res.data);
    },
    requestChat: async ({ system, messages, signal }) => {
      const res = await apiAds.post(
        '/ai/gigachat/chat',
        {
          model: GIGACHAT_MODEL,
          messages: [{ role: 'system', content: system }, ...messages],
        },
        { signal },
      );

      return extractText(res.data);
    },
  },
};

function requestAiPrompt(prompt: string, signal?: AbortSignal) {
  const provider = getAiProvider();
  return providerRequestHandlers[provider].requestPrompt({ prompt, signal });
}

function requestAiChat(system: string, messages: AiChatMessage[], signal?: AbortSignal) {
  const provider = getAiProvider();
  return providerRequestHandlers[provider].requestChat({ system, messages, signal });
}

export type AiPriceSuggestionInput = {
  title: string;
  category?: string;
  params?: Record<string, unknown>;
  description?: string;
};

export type AiPriceSuggestionResponse = {
  text: string;
};

function buildCommonPromptContext(input: {
  title: string;
  category?: string;
  params?: Record<string, unknown>;
  description?: string;
}) {
  return [
    `Заголовок: ${input.title}`,
    input.category ? `Категория: ${input.category}` : ``,
    input.params ? `Характеристики: ${JSON.stringify(input.params)}` : ``,
    input.description ? `Описание: ${input.description}` : ``,
  ];
}

function buildAiPrompt(instructions: string[], context: string[]) {
  return [...instructions, ``, ...context].filter(Boolean).join('\n');
}

export async function aiSuggestPrice(input: AiPriceSuggestionInput, signal?: AbortSignal): Promise<AiPriceSuggestionResponse> {
  const prompt = buildAiPrompt(
    [
      `Определи рыночную цену для объявления.`,
      `Дай ответ в 3-4 строках с диапазонами цен в рублях.`,
      `Учитывай заголовок и характеристики.`,
    ],
    buildCommonPromptContext(input),
  );

  const text = await requestAiPrompt(prompt, signal);

  return { text };
}

export type AiDescriptionSuggestionInput = {
  title: string;
  category?: string;
  params?: Record<string, unknown>;
  description?: string;
};

export type AiDescriptionSuggestionResponse = {
  text: string;
};

export async function aiSuggestDescription(input: AiDescriptionSuggestionInput, signal?: AbortSignal): Promise<AiDescriptionSuggestionResponse> {
  const hasDescription = Boolean(input.description?.trim());

  const prompt = buildAiPrompt(
    [
      hasDescription ? `Улучши описание объявления.` : `Сгенерируй описание объявления.`,
      `Пиши по-русски, 2-4 предложения, без воды и без списков.`,
      `Не добавляй контакты и персональные данные.`,
    ],
    [
      `Заголовок: ${input.title}`,
      input.category ? `Категория: ${input.category}` : ``,
      input.params ? `Характеристики: ${JSON.stringify(input.params)}` : ``,
      hasDescription ? `Текущее описание: ${input.description}` : ``,
    ],
  );

  const text = await requestAiPrompt(prompt, signal);

  return { text };
}

export type AiChatAboutItemInput = {
  itemContext: {
    id: string;
    title: string;
    category?: string;
    params?: Record<string, unknown>;
    price?: number | null;
    description?: string;
  };
  messages: AiChatMessage[];
};

export async function aiChatAboutItem(input: AiChatAboutItemInput, signal?: AbortSignal): Promise<{ text: string }> {
  const system = [
    `Ты помощник по созданию объявлений.`,
    `Отвечай по-русски, кратко и по делу.`,
    `Если не хватает данных — задай уточняющий вопрос.`,
    ``,
    `Контекст объявления (JSON):`,
    JSON.stringify(input.itemContext),
  ].join('\n');

  const text = await requestAiChat(system, input.messages, signal);

  return { text };
}
