import { ActionIcon } from '@mantine/core';

import { memo } from 'react';

import { MdOutlineClear } from 'react-icons/md';

export const ClearFieldAction = memo(function ClearFieldAction({ onClick }: { onClick: () => void }) {
  return (
    <ActionIcon variant="subtle" color="gray" aria-label="Очистить" onClick={onClick}>
      <MdOutlineClear size={18} />
    </ActionIcon>
  );
});
