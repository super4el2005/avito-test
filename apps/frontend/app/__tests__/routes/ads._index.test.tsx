import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';

import { describe, expect, it, vi, afterEach, beforeAll, beforeEach } from 'vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import AdsIndexRoute from '~/routes/ads._index';

const setSearchValues = vi.fn();

const mockedUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockedUseQuery(...args),
  };
});

vi.mock('~/shared', () => ({
  useUiPreference: () => ['grid', vi.fn()],
  useUrlSearchState: () => ({
    values: {
      q: 'iphone',
      categories: ['electronics'],
      page: 5,
      sort: 'price:asc',
      needsRevision: true,
    },
    setValues: setSearchValues,
  }),
}));

vi.mock('~/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/domain')>();
  return {
    ...actual,
    AdsSearchToolbar: () => <div data-testid="search-toolbar" />,
    AdsFiltersPanel: ({ onReset }: { onReset: () => void }) => (
      <button type="button" onClick={onReset}>
        Сбросить фильтры
      </button>
    ),
    AdsGrid: ({ ads }: { ads: Array<{ id: string }> }) => (
      <div>{ads.map((ad) => <div key={ad.id} data-testid={`grid-card-${ad.id}`}>card</div>)}</div>
    ),
    AdsList: ({ ads }: { ads: Array<{ id: string }> }) => (
      <div>{ads.map((ad) => <div key={ad.id} data-testid={`list-card-${ad.id}`}>card</div>)}</div>
    ),
    getAdsPlural: () => 'объявлений',
  };
});

function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <AdsIndexRoute />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ads._index route', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    class ResizeObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  beforeEach(() => {
    setSearchValues.mockReset();
    mockedUseQuery.mockReset();
  });
  afterEach(() => {
    cleanup();
  });

  it('shows error state without empty state', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      isPending: false,
      isPlaceholderData: false,
    });

    renderRoute();

    expect(screen.getByText('Ошибка')).toBeTruthy();
    expect(screen.queryByText('Ничего не найдено')).toBeNull();
  });

  it('shows empty state when request succeeds with no items', () => {
    mockedUseQuery.mockReturnValue({
      data: { data: { total: 0, items: [] } },
      isError: false,
      isLoading: false,
      isPending: false,
      isPlaceholderData: false,
    });

    renderRoute();

    expect(screen.getByText('Ничего не найдено')).toBeTruthy();
    expect(screen.queryByText('Ошибка')).toBeNull();
  });

  it('resets filters including page and sort', async () => {
    mockedUseQuery.mockReturnValue({
      data: { data: { total: 1, items: [{ id: '1' }] } },
      isError: false,
      isLoading: false,
      isPending: false,
      isPlaceholderData: false,
    });

    renderRoute();
    fireEvent.click(screen.getAllByRole('button', { name: 'Сбросить фильтры' })[0]);

    await waitFor(() => {
      expect(setSearchValues).toHaveBeenCalledWith(
        expect.objectContaining({
          q: '',
          categories: [],
          page: 1,
          sort: 'createdAt:desc',
          needsRevision: false,
        }),
      );
    });
  });
});
