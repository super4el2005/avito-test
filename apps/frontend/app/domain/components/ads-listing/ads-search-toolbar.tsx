import { ActionIcon, Group, Loader, Paper, Select, TextInput } from '@mantine/core';

import { MdFormatListBulleted, MdGridView, MdOutlineClear, MdSearch } from 'react-icons/md';

import { SORT_FORM } from '../../models/constants';
import type { SortFormValue } from '../../models/types';

export type AdsViewMode = 'grid' | 'list';

export type AdsSearchToolbarProps = {
  query: string;
  sort: SortFormValue;
  viewMode: AdsViewMode;
  isLoading: boolean;
  isUiTransitionPending: boolean;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  onSortChange: (value: SortFormValue) => void;
  onViewModeChange: (mode: AdsViewMode) => void;
};

export function AdsSearchToolbar({
  query,
  sort,
  viewMode,
  isLoading,
  isUiTransitionPending,
  onQueryChange,
  onClearQuery,
  onSortChange,
  onViewModeChange,
}: AdsSearchToolbarProps) {
  return (
    <Paper shadow="xs" radius="md" p="md">
      <Group>
        <TextInput
          flex={1}
          radius="md"
          placeholder="Найти объявление...."
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          rightSection={
            isLoading || isUiTransitionPending ? (
              <Loader size={20} />
            ) : query ? (
              <ActionIcon onClick={onClearQuery} variant="light" color="gray" aria-label="Очистить поиск">
                <MdOutlineClear size={20} />
              </ActionIcon>
            ) : (
              <MdSearch size={20} />
            )
          }
        />
        <ActionIcon.Group>
          <ActionIcon
            radius="md"
            onClick={() => onViewModeChange('grid')}
            variant={viewMode === 'grid' ? 'outline' : 'default'}
            size="lg"
            aria-label="Режим сетки"
          >
            <MdGridView size={20} />
          </ActionIcon>
          <ActionIcon
            radius="md"
            onClick={() => onViewModeChange('list')}
            variant={viewMode === 'list' ? 'outline' : 'default'}
            size="lg"
            aria-label="Режим списка"
          >
            <MdFormatListBulleted size={20} />
          </ActionIcon>
        </ActionIcon.Group>
        <Select
          w={260}
          radius="md"
          value={sort}
          onChange={(value) => {
            if (value) {
              onSortChange(value as SortFormValue);
            }
          }}
          data={SORT_FORM}
          allowDeselect={false}
        />
      </Group>
    </Paper>
  );
}
