import { MemoryRouter } from 'react-router';

import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { useUrlSearchState } from './useUrlSearchState';

import { act, renderHook, waitFor } from '@testing-library/react';

type SearchState = {
  q: string;
  page: number;
  categories: string[];
};

const wrapper = ({ children }: PropsWithChildren) => (
  <MemoryRouter initialEntries={['/?q=phone&page=2&categories=auto&categories=electronics']}>{children}</MemoryRouter>
);

describe('useUrlSearchState', () => {
  it('reads initial state from URLSearchParams', () => {
    const { result } = renderHook(
      () =>
        useUrlSearchState<SearchState>({
          debounceMs: 0,
          fromSearchParams: (params) => ({
            q: params.get('q') ?? '',
            page: Number(params.get('page') ?? 1),
            categories: params.getAll('categories'),
          }),
          toSearchParams: (values) => ({
            q: values.q,
            page: String(values.page),
            categories: values.categories,
          }),
        }),
      { wrapper },
    );

    expect(result.current.values).toEqual({
      q: 'phone',
      page: 2,
      categories: ['auto', 'electronics'],
    });
  });

  it('updates URLSearchParams via setValues', async () => {
    const { result } = renderHook(
      () =>
        useUrlSearchState<SearchState>({
          debounceMs: 0,
          fromSearchParams: (params) => ({
            q: params.get('q') ?? '',
            page: Number(params.get('page') ?? 1),
            categories: params.getAll('categories'),
          }),
          toSearchParams: (values) => ({
            q: values.q,
            page: String(values.page),
            categories: values.categories,
          }),
        }),
      { wrapper },
    );

    act(() => {
      result.current.setValues({
        q: 'laptop',
        page: 3,
        categories: ['electronics'],
      });
    });

    await waitFor(() => {
      expect(result.current.searchParams.get('q')).toBe('laptop');
      expect(result.current.searchParams.get('page')).toBe('3');
      expect(result.current.searchParams.getAll('categories')).toEqual(['electronics']);
    });
  });
});
