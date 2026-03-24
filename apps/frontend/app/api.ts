import axios from 'axios';

export const apiAds = axios.create({
  baseURL: 'http://127.0.0.1:8080/',
});

const OLLAMA_MODEL = 'llama3.1';
const GIGACHAT_MODEL = 'GigaChat-2';
const AI_PROVIDER = (import.meta.env.VITE_AI_PROVIDER ?? 'ollama').toLowerCase();
export const apiOllama = axios.create({
  baseURL: 'http://127.0.0.1:11434/',
});

function extractText(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  const data = payload as {
    response?: unknown;
    message?: { content?: unknown };
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (typeof data?.message?.content === 'string') {
    return data.message.content;
  }

  if (typeof data?.response === 'string') {
    return data.response;
  }

  if (typeof data?.choices?.[0]?.message?.content === 'string') {
    return data.choices[0].message.content;
  }

  return JSON.stringify(payload);
}

async function requestFromOllamaGenerate(prompt: string, signal?: AbortSignal): Promise<string> {
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
}

async function requestFromGigaChatPrompt(prompt: string, signal?: AbortSignal): Promise<string> {
  const res = await apiAds.post(
    '/ai/gigachat/chat',
    {
      model: GIGACHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal },
  );

  return extractText(res.data);
}

async function requestFromOllamaChat(
  system: string,
  messages: AiChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
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
}

async function requestFromGigaChatChat(
  system: string,
  messages: AiChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await apiAds.post(
    '/ai/gigachat/chat',
    {
      model: GIGACHAT_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
    },
    { signal },
  );

  return extractText(res.data);
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

export async function aiSuggestPrice(input: AiPriceSuggestionInput, signal?: AbortSignal): Promise<AiPriceSuggestionResponse> {
  const prompt = [
    `Определи рыночную цену для объявления.`,
    `Дай ответ в 3-4 строках с диапазонами цен в рублях.`,
    `Учитывай заголовок и характеристики.`,
    ``,
    `Заголовок: ${input.title}`,
    input.category ? `Категория: ${input.category}` : ``,
    input.params ? `Характеристики: ${JSON.stringify(input.params)}` : ``,
    input.description ? `Описание: ${input.description}` : ``,
  ]
    .filter(Boolean)
    .join('\n');

  const text =
    AI_PROVIDER === 'gigachat'
      ? await requestFromGigaChatPrompt(prompt, signal)
      : await requestFromOllamaGenerate(prompt, signal);

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

  const prompt = [
    hasDescription ? `Улучши описание объявления.` : `Сгенерируй описание объявления.`,
    `Пиши по-русски, 2-4 предложения, без воды и без списков.`,
    `Не добавляй контакты и персональные данные.`,
    ``,
    `Заголовок: ${input.title}`,
    input.category ? `Категория: ${input.category}` : ``,
    input.params ? `Характеристики: ${JSON.stringify(input.params)}` : ``,
    hasDescription ? `Текущее описание: ${input.description}` : ``,
  ]
    .filter(Boolean)
    .join('\n');

  const text =
    AI_PROVIDER === 'gigachat'
      ? await requestFromGigaChatPrompt(prompt, signal)
      : await requestFromOllamaGenerate(prompt, signal);

  return { text };
}

export type AiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

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

  const text =
    AI_PROVIDER === 'gigachat'
      ? await requestFromGigaChatChat(system, input.messages, signal)
      : await requestFromOllamaChat(system, input.messages, signal);

  return { text };
}
