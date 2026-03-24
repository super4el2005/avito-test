export const translateByMap = <K extends string>(
  key: K,
  map: Partial<Record<K, string>> | Record<string, string>,
): string => {
  if (key in map && typeof map[key] === 'string') return map[key] as string;
  return key;
};
