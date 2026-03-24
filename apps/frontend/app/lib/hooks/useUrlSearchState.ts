import { useDebouncedCallback } from '@mantine/hooks';

import { useMemo } from 'react';

import { useSearchParams } from 'react-router';

type UseUrlSearchStateConfig<TValues extends Record<string, unknown>> = {
  debounceMs?: number;
  fromSearchParams: (searchParams: URLSearchParams) => TValues;
  toSearchParams: (values: TValues) => Record<string, string | string[]>;
};

type UseUrlSearchStateResult<TValues extends Record<string, unknown>> = {
  values: TValues;
  searchParams: URLSearchParams;
  setValues: (values: TValues) => void;
};

export const useUrlSearchState = <TValues extends Record<string, unknown>>({
  debounceMs = 0,
  fromSearchParams,
  toSearchParams,
}: UseUrlSearchStateConfig<TValues>): UseUrlSearchStateResult<TValues> => {
  const [searchParams, setSearchParams] = useSearchParams();
  const setSearchParamsDebounced = useDebouncedCallback(setSearchParams, debounceMs);

  const values = useMemo(() => fromSearchParams(searchParams), [fromSearchParams, searchParams]);

  return {
    values,
    searchParams,
    setValues: (nextValues) => {
      const queryObject = toSearchParams(nextValues);
      if (debounceMs > 0) {
        setSearchParamsDebounced(queryObject);
        return;
      }
      setSearchParams(queryObject);
    },
  };
};
