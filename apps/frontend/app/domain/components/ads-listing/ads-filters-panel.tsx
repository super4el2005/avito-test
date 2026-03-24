import { Accordion, Button, Checkbox, Paper, Stack, Switch, Title } from '@mantine/core';

import { CATEGORIES_FORM } from '../../models/constants';
import type { Category } from '../../models/types';

export type AdsFiltersPanelProps = {
  categories: Category[];
  needsRevision: boolean;
  isDirty: boolean;
  onCategoriesChange: (value: Category[]) => void;
  onNeedsRevisionChange: (value: boolean) => void;
  onReset: () => void;
};

export function AdsFiltersPanel({
  categories,
  needsRevision,
  isDirty,
  onCategoriesChange,
  onNeedsRevisionChange,
  onReset,
}: AdsFiltersPanelProps) {
  return (
    <Paper shadow="xs" radius="md" p="md">
      <Stack w={200}>
        <Title order={3}>Фильтры</Title>
        <Accordion defaultValue="category">
          <Accordion.Item value="category">
            <Accordion.Control>Категория</Accordion.Control>
            <Accordion.Panel>
              <Checkbox.Group value={categories} onChange={(value) => onCategoriesChange(value as Category[])}>
                <Stack mt="xs">
                  {CATEGORIES_FORM.map((category) => (
                    <Checkbox key={category.value} value={category.value} label={category.label} />
                  ))}
                </Stack>
              </Checkbox.Group>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Switch checked={needsRevision} onChange={(event) => onNeedsRevisionChange(event.currentTarget.checked)} label="Только требующие доработок" />
        <Button disabled={!isDirty} onClick={onReset}>
          Сбросить фильтры
        </Button>
      </Stack>
    </Paper>
  );
}
