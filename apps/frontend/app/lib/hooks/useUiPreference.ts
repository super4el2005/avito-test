import { useLocalStorage } from '@mantine/hooks';

type UseUiPreferenceConfig<TValue> = {
  key: string;
  defaultValue: TValue;
};

export function useUiPreference<TValue>({ key, defaultValue }: UseUiPreferenceConfig<TValue>) {
  return useLocalStorage<TValue>({
    key,
    defaultValue,
  });
}
