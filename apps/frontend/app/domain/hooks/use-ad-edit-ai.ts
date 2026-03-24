import { useMemo, useState } from 'react';

import type { ChatContextRef } from '../components/ai-assist';
import { AI_REQUEST_ERROR_MESSAGE } from '../models/constants';
import type { ItemEditFormValues } from '../models/types';

import { aiSuggestDescription, aiSuggestPrice } from '~/api';
import {
  type AsyncPopoverRequestState,
  extractErrorMessage,
  parseSuggestedNumber,
  useAsyncPopoverRequest,
} from '~/shared';

type UseAdEditAiParams = {
  id: string;
  values: ItemEditFormValues;
};

type UseAdEditAiResult = Readonly<{
  priceAiState: AsyncPopoverRequestState<string>;
  descriptionAiState: AsyncPopoverRequestState<string>;
  descriptionAiBeforeText: string;
  aiSuggestedPrice: number | null;
  chatContext: ChatContextRef;
}>;

export function useAdEditAi({ id, values }: UseAdEditAiParams) {
  function mapAiError(error: unknown) {
    return extractErrorMessage(error, AI_REQUEST_ERROR_MESSAGE);
  }

  function createSuggestionInput() {
    return {
      title: values.title,
      category: values.category,
      params: values.params,
      description: values.description || undefined,
    };
  }

  const priceAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => (await aiSuggestPrice(createSuggestionInput())).text,
    mapErrorToMessage: mapAiError,
  });

  const [descriptionAiBeforeText, setDescriptionAiBeforeText] = useState<string>('');

  const descriptionAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      setDescriptionAiBeforeText(values.description);
      return (await aiSuggestDescription(createSuggestionInput())).text;
    },
    mapErrorToMessage: mapAiError,
  });

  const aiSuggestedPrice = useMemo(() => parseSuggestedNumber(priceAiState.data ?? ''), [priceAiState.data]);

  const chatContext = useMemo<ChatContextRef>(
    () => ({
      id,
      title: values.title,
      category: values.category,
      params: values.params ?? {},
      price: values.price,
      description: values.description || undefined,
    }),
    [id, values.title, values.category, values.params, values.price, values.description],
  );

  return {
    priceAiState,
    descriptionAiState,
    descriptionAiBeforeText,
    aiSuggestedPrice,
    chatContext,
  } satisfies UseAdEditAiResult;
}
