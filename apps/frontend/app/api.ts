import axios from 'axios';

export const apiAds = axios.create({
  baseURL: 'http://127.0.0.1:8080/',
});
export const apiOllama = axios.create({
  baseURL: 'http://127.0.0.1:11434/',
});

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

  // Ollama API: POST /api/generate
  const res = await apiOllama.post(
    '/api/generate',
    {
      model: 'llama3.1',
      prompt,
      stream: false,
    },
    { signal },
  );

  const text = typeof res.data?.response === 'string' ? res.data.response : typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

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

  const res = await apiOllama.post(
    '/api/generate',
    {
      model: 'llama3.1',
      prompt,
      stream: false,
    },
    { signal },
  );

  const text = typeof res.data?.response === 'string' ? res.data.response : typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

  return { text };
}

export type AiChatMessage = {
  role: 'user' | 'assistant';
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

  // Ollama API: POST /api/chat
  const res = await apiOllama.post(
    '/api/chat',
    {
      model: 'llama3.1',
      stream: false,
      messages: [{ role: 'system', content: system }, ...input.messages],
    },
    { signal },
  );

  const text =
    typeof res.data?.message?.content === 'string'
      ? res.data.message.content
      : typeof res.data?.response === 'string'
        ? res.data.response
        : typeof res.data === 'string'
          ? res.data
          : JSON.stringify(res.data);

  return { text };
}
