import { useMutation } from '@tanstack/react-query';

import { useState } from 'react';

type UseAsyncPopoverRequestConfig<TData> = {
  mutationFn: () => Promise<TData>;
  mapErrorToMessage: (error: unknown) => string;
};

type UseAsyncPopoverRequestResult<TData> = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  data: TData | null;
  error: string | null;
  hasEverRun: boolean;
  isPending: boolean;
  run: () => void;
};

export function useAsyncPopoverRequest<TData>({
  mutationFn,
  mapErrorToMessage,
}: UseAsyncPopoverRequestConfig<TData>): UseAsyncPopoverRequestResult<TData> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasEverRun, setHasEverRun] = useState(false);

  const mutation = useMutation({
    mutationFn,
    onSuccess: (nextData) => {
      setHasEverRun(true);
      setError(null);
      setData(nextData);
      setIsOpen(true);
    },
    onError: (requestError) => {
      setHasEverRun(true);
      setData(null);
      setError(mapErrorToMessage(requestError));
      setIsOpen(true);
    },
  });

  return {
    isOpen,
    setIsOpen,
    data,
    error,
    hasEverRun,
    isPending: mutation.isPending,
    run: () => mutation.mutate(),
  };
}
