import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PropsWithChildren } from 'react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { useAdEditFormModel } from './use-ad-edit-form-model';

import { act, renderHook, waitFor } from '@testing-library/react';

const navigateMock = vi.fn();
const apiPutMock = vi.fn();
const notificationShowMock = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('~/api', () => ({
  apiAds: {
    put: (...args: unknown[]) => apiPutMock(...args),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => notificationShowMock(...args),
  },
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

describe('useAdEditFormModel', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    apiPutMock.mockReset();
    notificationShowMock.mockReset();
  });

  it('submits sanitized payload and redirects on success', async () => {
    apiPutMock.mockResolvedValue({});

    const { result } = renderHook(
      () =>
        useAdEditFormModel({
          id: 'ad-100',
          warningStyles: { input: { borderColor: 'yellow' } },
          item: {
            id: 100,
            category: 'electronics',
            title: '  Ноутбук  ',
            price: 40000,
            description: '  Описание  ',
            params: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            needsRevision: false,
            missingParams: [],
          },
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.updateAdMutation.mutateAsync({
        ...result.current.form.values,
        title: '  Новый заголовок  ',
        description: '  Новое описание  ',
      });
    });

    await waitFor(() => {
      expect(apiPutMock).toHaveBeenCalledWith('/items/ad-100', expect.objectContaining({ title: 'Новый заголовок', description: 'Новое описание' }));
      expect(navigateMock).toHaveBeenCalledWith('/ads/ad-100');
    });
  });
});
