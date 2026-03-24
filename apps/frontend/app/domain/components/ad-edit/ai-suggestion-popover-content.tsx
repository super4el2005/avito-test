import { Text, Title } from '@mantine/core';

import { type ReactNode } from 'react';

import { AiPopoverActions, AiPopoverError } from '../ai-assist';

type AiSuggestionPopoverContentProps = {
  errorMessage: string | null;
  responseText: string;
  onClose: () => void;
  onApply: () => void;
  isApplyDisabled?: boolean;
  /** Разметка между телом ответа и кнопками (например, сравнение «было / стало»). */
  betweenBodyAndActions?: ReactNode;
};

export function AiSuggestionPopoverContent({
  errorMessage,
  responseText,
  onClose,
  onApply,
  isApplyDisabled,
  betweenBodyAndActions,
}: AiSuggestionPopoverContentProps) {
  if (errorMessage) {
    return <AiPopoverError message={errorMessage} onClose={onClose} />;
  }

  return (
    <>
      <Title order={5}>Ответ AI:</Title>
      <Text style={{ whiteSpace: 'pre-wrap' }}>{responseText}</Text>
      {betweenBodyAndActions}
      <AiPopoverActions onApply={onApply} onClose={onClose} isApplyDisabled={isApplyDisabled} />
    </>
  );
}
