import { useForm } from '@mantine/form';

import { useQuery } from '@tanstack/react-query';

import { useCallback, useDeferredValue, useMemo, useTransition } from 'react';

import {
  AdsListSearchStateSchema,
  ItemsGetInQuerySchema,
} from '@ads/shared';

import { buildLoadingSkeletonKeys } from '../components/ads-loading-skeletons';
import { LIMIT_ADS } from '../models/constants';
import type { AdsResponse, Category, SortFormValue } from '../models/types';

import { apiAds } from '~/api';
import { useUiPreference, useUrlSearchState } from '~/shared';

/** Состояние списка в URL и в форме Mantine (поле `sort` — «column:direction», как в SORT_FORM). */
export type AdsListPageSearchValues = {
  q: string;
  categories: Category[];
  page: number;
  sort: SortFormValue;
  needsRevision: boolean;
};

export function useAdsListPage() {
  const defaultSort = `${AdsListSearchStateSchema.shape.sortColumn.parse('createdAt')}:${AdsListSearchStateSchema.shape.sortDirection.parse('desc')}` as SortFormValue;

  const fromSearchParams = useCallback(
    (params: URLSearchParams): AdsListPageSearchValues => ({
      q: AdsListSearchStateSchema.shape.q.parse(params.get('q') ?? ''),
      categories: AdsListSearchStateSchema.shape.categories.parse(params.getAll('categories') ?? []),
      page: AdsListSearchStateSchema.shape.page.catch(1).parse(Number(params.get('page') ?? 1)),
      sort: (params.get('sort') ?? defaultSort) as SortFormValue,
      needsRevision: AdsListSearchStateSchema.shape.needsRevision.parse(params.get('needsRevision') === 'true'),
    }),
    [defaultSort],
  );

  const toSearchParams = useCallback(
    (values: AdsListPageSearchValues) => ({
      ...values,
      needsRevision: String(values.needsRevision),
      page: String(values.page),
    }),
    [],
  );

  const searchStateUrl = useUrlSearchState({
    debounceMs: 500,
    fromSearchParams,
    toSearchParams,
  });

  const [viewMode, setViewMode] = useUiPreference<'grid' | 'list'>({
    key: 'view-mode',
    defaultValue: 'grid',
  });
  const [isUiTransitionPending, startUiTransition] = useTransition();

  const deferredSearchState = useDeferredValue(searchStateUrl.values);
  const sortValue = deferredSearchState.sort || ('createdAt:desc' as SortFormValue);
  const [sortColumn = 'createdAt', sortDirection = 'asc'] = sortValue.split(':');
  const page = Math.max(1, Number(deferredSearchState.page) || 1);
  const categories = deferredSearchState.categories.join(',');
  const limit = String(LIMIT_ADS);
  const skip = String((page - 1) * LIMIT_ADS);
  const needsRevision = String(deferredSearchState.needsRevision);

  const getAdsQuery = useQuery({
    queryKey: ['ads', deferredSearchState.q, categories, page, sortColumn, sortDirection, deferredSearchState.needsRevision],
    queryFn: ({ signal }) => {
      const parsedQuery = ItemsGetInQuerySchema.parse({
        q: deferredSearchState.q,
        categories,
        limit,
        skip,
        needsRevision,
        sortColumn,
        sortDirection,
      });

      return apiAds.get<AdsResponse>('/items', {
        params: {
          q: parsedQuery.q,
          categories: parsedQuery.categories?.join(','),
          limit: parsedQuery.limit,
          skip: parsedQuery.skip,
          needsRevision: parsedQuery.needsRevision,
          sortColumn: parsedQuery.sortColumn,
          sortDirection: parsedQuery.sortDirection,
        },
        signal,
      });
    },
    placeholderData: (previousData) => previousData,
  });

  const form = useForm<AdsListPageSearchValues>({
    initialValues: searchStateUrl.values,
    onValuesChange: (values) => {
      startUiTransition(() => {
        searchStateUrl.setValues(values);
      });
    },
  });

  const totalAds = getAdsQuery.data?.data.total ?? 0;
  const totalPagingPages = Math.ceil(totalAds / LIMIT_ADS);
  const ads = getAdsQuery.data?.data.items ?? [];

  const isDataLoading = getAdsQuery.isPlaceholderData || (getAdsQuery.isLoading && !getAdsQuery.data);
  const isFiltersActive = Boolean(
    form.values.categories.length || form.values.needsRevision || form.values.q,
  );
  const loadingSkeletonKeys = useMemo(() => buildLoadingSkeletonKeys(), []);

  const handleQueryChange = useCallback(
    (value: string) => {
      startUiTransition(() => {
        form.setValues((prev) => ({ ...prev, q: value, page: 1 }));
      });
    },
    [form, startUiTransition],
  );

  const handleClearQuery = useCallback(() => {
    startUiTransition(() => {
      form.setValues((prev) => ({ ...prev, q: '', page: 1 }));
    });
  }, [form, startUiTransition]);

  const handleSortChange = useCallback(
    (value: SortFormValue) => {
      form.setFieldValue('sort', value);
    },
    [form],
  );

  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'list') => {
      startUiTransition(() => {
        setViewMode(mode);
      });
    },
    [setViewMode, startUiTransition],
  );

  const handleCategoriesChange = useCallback(
    (value: Category[]) => {
      startUiTransition(() => {
        form.setValues((prev) => ({ ...prev, categories: value, page: 1 }));
      });
    },
    [form, startUiTransition],
  );

  const handleNeedsRevisionChange = useCallback(
    (value: boolean) => {
      startUiTransition(() => {
        form.setValues((prev) => ({ ...prev, needsRevision: value, page: 1 }));
      });
    },
    [form, startUiTransition],
  );

  const handleResetFilters = useCallback(() => {
    startUiTransition(() => {
      form.setValues({
        q: '',
        categories: [],
        page: 1,
        sort: defaultSort,
        needsRevision: false,
      });
    });
  }, [defaultSort, form, startUiTransition]);

  const handlePageChange = useCallback(
    (value: number) => {
      form.setFieldValue('page', value);
    },
    [form],
  );

  return {
    form,
    viewMode,
    getAdsQuery,
    ads,
    isDataLoading,
    isFiltersActive,
    loadingSkeletonKeys,
    isUiTransitionPending,
    totalPagingPages,
    defaultSort,
    handleQueryChange,
    handleClearQuery,
    handleSortChange,
    handleViewModeChange,
    handleCategoriesChange,
    handleNeedsRevisionChange,
    handleResetFilters,
    handlePageChange,
  };
}
