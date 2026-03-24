import { Button, Group } from '@mantine/core';

import { Link } from 'react-router';

export type EditFormSubmitRowProps = {
  adId: string;
  onSubmit: () => void;
  canSubmit: boolean;
  isSaving: boolean;
};

export function EditFormSubmitRow({ adId, onSubmit, canSubmit, isSaving }: EditFormSubmitRowProps) {
  return (
    <Group justify="flex-start" mt="sm">
      <Button onClick={onSubmit} disabled={!canSubmit || isSaving} loading={isSaving}>
        Сохранить
      </Button>
      <Button variant="default" component={Link} to={`/ads/${adId}`}>
        Отменить
      </Button>
    </Group>
  );
}
