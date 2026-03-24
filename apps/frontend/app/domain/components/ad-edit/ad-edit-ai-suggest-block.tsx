import type { ReactNode } from 'react';

import { AiSuggestionPopover } from '../ai-assist';
import { AiSuggestionPopoverContent } from './ai-suggestion-popover-content';

import type { AsyncPopoverRequestState } from '~/shared';

export type AdEditAiSuggestBlockProps = {
  aiState: AsyncPopoverRequestState<string>;
  buttonLabel: string;
  buttonWidth?: string;
  errorMessage: string | null;
  responseText: string;
  onClose: () => void;
  onApply: () => void;
  isApplyDisabled: boolean;
  betweenBodyAndActions?: ReactNode;
};

export function AdEditAiSuggestBlock({
  aiState,
  buttonLabel,
  buttonWidth,
  errorMessage,
  responseText,
  onClose,
  onApply,
  isApplyDisabled,
  betweenBodyAndActions,
}: AdEditAiSuggestBlockProps) {
  return (
    <AiSuggestionPopover
      isOpen={aiState.isOpen}
      setIsOpen={aiState.setIsOpen}
      isPending={aiState.isPending}
      hasEverRun={aiState.hasEverRun}
      onRun={aiState.run}
      buttonLabel={buttonLabel}
      buttonWidth={buttonWidth}
    >
      <AiSuggestionPopoverContent
        errorMessage={errorMessage}
        responseText={responseText}
        onClose={onClose}
        onApply={onApply}
        isApplyDisabled={isApplyDisabled}
        betweenBodyAndActions={betweenBodyAndActions}
      />
    </AiSuggestionPopover>
  );
}
