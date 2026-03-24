import { Button, Group, Popover, Stack, Text, Title } from '@mantine/core';

import { memo, type ReactNode } from 'react';

import { MdLightbulbOutline } from 'react-icons/md';

export type AiPopoverErrorProps = {
  message: string;
  onClose: () => void;
};

export const AiPopoverError = memo(function AiPopoverError({ message, onClose }: AiPopoverErrorProps) {
  return (
    <>
      <Title order={5} c="red">
        Произошла ошибка при запросе к AI
      </Title>
      <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
        {message}
      </Text>
      <Group justify="flex-start">
        <Button variant="default" onClick={onClose}>
          Закрыть
        </Button>
      </Group>
    </>
  );
});

export type AiPopoverActionsProps = {
  onApply: () => void;
  onClose: () => void;
  isApplyDisabled?: boolean;
};

export const AiPopoverActions = memo(function AiPopoverActions({
  onApply,
  onClose,
  isApplyDisabled,
}: AiPopoverActionsProps) {
  return (
    <Group justify="flex-start">
      <Button onClick={onApply} disabled={isApplyDisabled}>
        Применить
      </Button>
      <Button variant="default" onClick={onClose}>
        Закрыть
      </Button>
    </Group>
  );
});

export type AiSuggestionPopoverProps = {
  isOpen: boolean;
  setIsOpen: (next: boolean) => void;
  isPending: boolean;
  hasEverRun: boolean;
  onRun: () => void;
  buttonLabel: string;
  buttonWidth?: string;
  children: ReactNode;
};

export const AiSuggestionPopover = memo(function AiSuggestionPopover({
  isOpen,
  setIsOpen,
  isPending,
  hasEverRun,
  onRun,
  buttonLabel,
  buttonWidth,
  children,
}: AiSuggestionPopoverProps) {
  return (
    <Popover
      position="bottom-start"
      withArrow
      shadow="md"
      opened={isOpen}
      onChange={setIsOpen}
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Popover.Target>
        <Button w={buttonWidth} variant="light" leftSection={<MdLightbulbOutline size={20} />} loading={isPending} onClick={onRun}>
          {isPending ? 'Выполняется запрос' : hasEverRun ? 'Повторить запрос' : buttonLabel}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm" w={420}>
          {children}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
});
