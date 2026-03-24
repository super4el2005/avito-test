import {
  Alert,
  Container,
  Group,
  Pagination,
  Skeleton,
  Stack,
  Title,
} from '@mantine/core';

import { MdInfo } from 'react-icons/md';

import {
  AdsFiltersPanel,
  AdsGrid,
  AdsList,
  AdsSearchToolbar,
  getAdsPlural,
  useAdsListPage,
} from '~/domain';

export default function () {
  const {
    form,
    viewMode,
    getAdsQuery,
    ads,
    isDataLoading,
    isFiltersActive,
    loadingSkeletonKeys,
    isUiTransitionPending,
    totalPagingPages,
    handleQueryChange,
    handleClearQuery,
    handleSortChange,
    handleViewModeChange,
    handleCategoriesChange,
    handleNeedsRevisionChange,
    handleResetFilters,
    handlePageChange,
  } = useAdsListPage();

  return (
    <Container size={'xl'}>
      <Stack>
        <Title>Мои объявления</Title>
        <Title order={2}>
          {getAdsQuery.isLoading ? (
            <Skeleton height={35} width={150} radius="xl" />
          ) : (
            `${getAdsQuery.data?.data.total} ${getAdsPlural(getAdsQuery.data?.data.total || 0)}`
          )}
        </Title>
        <AdsSearchToolbar
          query={form.values.q}
          sort={form.values.sort}
          viewMode={viewMode}
          isLoading={getAdsQuery.isLoading}
          isUiTransitionPending={isUiTransitionPending}
          onQueryChange={handleQueryChange}
          onClearQuery={handleClearQuery}
          onSortChange={handleSortChange}
          onViewModeChange={handleViewModeChange}
        />
        <Group align="flex-start">
          <AdsFiltersPanel
            categories={form.values.categories}
            needsRevision={form.values.needsRevision}
            isDirty={isFiltersActive}
            onCategoriesChange={handleCategoriesChange}
            onNeedsRevisionChange={handleNeedsRevisionChange}
            onReset={handleResetFilters}
          />
          <Stack flex={1}>
            {getAdsQuery.isError && <Alert color="red" icon={<MdInfo />} title="Ошибка"></Alert>}
            {!getAdsQuery.isError && !getAdsQuery.data?.data.items.length && !getAdsQuery.isLoading && (
              <Alert icon={<MdInfo />} title="Ничего не найдено"></Alert>
            )}
            {viewMode === 'grid' && <AdsGrid ads={ads} isDataLoading={isDataLoading} skeletonKeys={loadingSkeletonKeys} />}
            {viewMode === 'list' && <AdsList ads={ads} isDataLoading={isDataLoading} skeletonKeys={loadingSkeletonKeys} />}
            <Pagination
              value={form.values.page}
              onChange={handlePageChange}
              total={totalPagingPages}
              disabled={getAdsQuery.isPending && !getAdsQuery.data}
            />
          </Stack>
        </Group>
      </Stack>
    </Container>
  );
}
