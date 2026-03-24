import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useAdEditAi } from './use-ad-edit-ai';

const aiSuggestPriceMock = vi.fn();
const aiSuggestDescriptionMock = vi.fn();

vi.mock('~/api', () => ({
  aiSuggestPrice: (...args: unknown[]) => aiSuggestPriceMock(...args),
  aiSuggestDescription: (...args: unknown[]) => aiSuggestDescriptionMock(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAdEditAi', () => {
  beforeEach(() => {
    aiSuggestPriceMock.mockReset();
    aiSuggestDescriptionMock.mockReset();
  });

  it('runs AI suggestions successfully and extracts numeric price', async () => {
    aiSuggestPriceMock.mockResolvedValue({ text: 'Рыночный диапазон: 120000 - 150000 руб.' });
    aiSuggestDescriptionMock.mockResolvedValue({ text: 'Отличное состояние, полностью исправен.' });

    const { result } = renderHook(
      () =>
        useAdEditAi({
          id: 'ad-1',
          values: {
            category: 'electronics',
            title: 'Ноутбук',
            price: 100000,
            description: 'Старое описание',
            params: {},
          },
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.priceAiState.run();
      result.current.descriptionAiState.run();
    });

    await waitFor(() => {
      expect(result.current.priceAiState.data).toContain('120000');
      expect(result.current.descriptionAiState.data).toContain('Отличное состояние');
    });
    expect(result.current.aiSuggestedPrice).toBe(135000);
    expect(result.current.descriptionAiBeforeText).toBe('Старое описание');
  });

  it('maps errors for failed AI requests', async () => {
    aiSuggestPriceMock.mockRejectedValue(new Error('network error'));
    aiSuggestDescriptionMock.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(
      () =>
        useAdEditAi({
          id: 'ad-2',
          values: {
            category: 'electronics',
            title: 'Телефон',
            price: null,
            description: '',
            params: {},
          },
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.priceAiState.run();
      result.current.descriptionAiState.run();
    });

    await waitFor(() => {
      expect(result.current.priceAiState.error).toBeTruthy();
      expect(result.current.descriptionAiState.error).toBeTruthy();
    });
  });
});
