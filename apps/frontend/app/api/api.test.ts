import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ollamaPostMock, adsPostMock } = vi.hoisted(() => ({
  ollamaPostMock: vi.fn(),
  adsPostMock: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn((config: { baseURL?: string }) => {
      if (config.baseURL?.includes('11434')) {
        return { post: ollamaPostMock };
      }
      return { post: adsPostMock };
    }),
  },
}));

import { aiChatAboutItem, aiSuggestDescription, aiSuggestPrice } from './ai-provider';

describe('api ai helpers', () => {
  beforeEach(() => {
    ollamaPostMock.mockReset();
    adsPostMock.mockReset();
  });

  it('requests price suggestion through ollama prompt pipeline', async () => {
    ollamaPostMock.mockResolvedValueOnce({ data: { response: '1200-1500 ₽' } });

    const response = await aiSuggestPrice({
      title: 'Велосипед',
      category: 'electronics',
      params: { condition: 'used' },
      description: 'В хорошем состоянии',
    });

    expect(response.text).toBe('1200-1500 ₽');
    expect(ollamaPostMock).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({
        stream: false,
        prompt: expect.stringContaining('Заголовок: Велосипед'),
      }),
      expect.any(Object),
    );
  });

  it('requests description suggestion through shared prompt pipeline', async () => {
    ollamaPostMock.mockResolvedValueOnce({ data: { message: { content: 'Короткое описание' } } });

    const response = await aiSuggestDescription({
      title: 'Ноутбук',
      description: 'Старый текст',
    });

    expect(response.text).toBe('Короткое описание');
    expect(ollamaPostMock).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({
        prompt: expect.stringContaining('Текущее описание: Старый текст'),
      }),
      expect.any(Object),
    );
  });

  it('requests item chat via provider chat endpoint', async () => {
    ollamaPostMock.mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Ответ AI' } }] } });

    const response = await aiChatAboutItem({
      itemContext: { id: '1', title: 'Ноутбук', category: 'electronics', params: {}, price: 1000, description: '' },
      messages: [{ role: 'user', content: 'Какие плюсы?' }],
    });

    expect(response.text).toBe('Ответ AI');
    expect(ollamaPostMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        messages: expect.arrayContaining([{ role: 'system', content: expect.stringContaining('Контекст объявления') }]),
      }),
      expect.any(Object),
    );
    expect(adsPostMock).not.toHaveBeenCalled();
  });
});
