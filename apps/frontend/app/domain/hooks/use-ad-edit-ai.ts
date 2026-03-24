import { useMemo, useState } from 'react';

import type { ChatContextRef } from '../components/ai-assist';
import { AI_REQUEST_ERROR_MESSAGE } from '../components/ai-assist';
import type { ItemEditFormValues } from '../models/types';

import { aiSuggestDescription, aiSuggestPrice } from '~/api';
import { extractErrorMessage,parseSuggestedNumber, useAsyncPopoverRequest } from '~/shared';

type UseAdEditAiParams = {
  id: string;
  values: ItemEditFormValues;
};

type UseAdEditAiResult = Readonly<{
  priceAiState: ReturnType<typeof useAsyncPopoverRequest<string>>;
  descriptionAiState: ReturnType<typeof useAsyncPopoverRequest<string>>;
  descriptionAiBeforeText: string;
  aiSuggestedPrice: number | null;
  chatContext: ChatContextRef;
}>;

export function useAdEditAi({ id, values }: UseAdEditAiParams) {
  const priceAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      const res = await aiSuggestPrice({
        title: values.title,
        category: values.category,
        params: values.params,
        description: values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: (error) => extractErrorMessage(error, AI_REQUEST_ERROR_MESSAGE),
  });

  const [descriptionAiBeforeText, setDescriptionAiBeforeText] = useState<string>('');

  const descriptionAiState = useAsyncPopoverRequest<string>({
    mutationFn: async () => {
      setDescriptionAiBeforeText(values.description);
      const res = await aiSuggestDescription({
        title: values.title,
        category: values.category,
        params: values.params,
        description: values.description || undefined,
      });
      return res.text;
    },
    mapErrorToMessage: (error) => extractErrorMessage(error, AI_REQUEST_ERROR_MESSAGE),
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
