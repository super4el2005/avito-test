import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { useAsyncPopoverRequest } from './useAsyncPopoverRequest';

import { act, renderHook, waitFor } from '@testing-library/react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAsyncPopoverRequest', () => {
  it('stores data and opens popover on success', async () => {
    const { result } = renderHook(
      () =>
        useAsyncPopoverRequest({
          mutationFn: async () => 'ok',
          mapErrorToMessage: () => 'error',
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.run();
    });

    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.hasEverRun).toBe(true);
  });

  it('stores mapped error and opens popover on failure', async () => {
    const { result } = renderHook(
      () =>
        useAsyncPopoverRequest({
          mutationFn: async () => {
            throw new Error('boom');
          },
          mapErrorToMessage: () => 'mapped-error',
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.run();
    });

    await waitFor(() => expect(result.current.error).toBe('mapped-error'));
    expect(result.current.data).toBeNull();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.hasEverRun).toBe(true);
  });
});
