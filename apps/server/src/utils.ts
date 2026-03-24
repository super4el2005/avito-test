import { AutoItemParamsSchema, ElectronicsEstateItemParamsSchema, Item, RealEstateItemParamsSchema } from "@ads/shared";

export const doesItemNeedRevision = (item: Item): boolean =>
  !Boolean(item.description) ||
  !(() => {
    if (item.category === 'auto')
      return AutoItemParamsSchema.safeParse(item.params).success;
    if (item.category === 'real_estate')
      return RealEstateItemParamsSchema.safeParse(item.params).success;

    return ElectronicsEstateItemParamsSchema.safeParse(item.params).success;
  })();

export const getMissingItemParams = (item: Item): string[] => {
  const parseResult = (() => {
    if (item.category === 'auto') return AutoItemParamsSchema.safeParse(item.params);
    if (item.category === 'real_estate') return RealEstateItemParamsSchema.safeParse(item.params);
    return ElectronicsEstateItemParamsSchema.safeParse(item.params);
  })();

  if (parseResult.success) return [];

  return Array.from(
    new Set(
      parseResult.error.issues
        .map(issue => issue.path[0])
        .filter((pathPart): pathPart is string => typeof pathPart === 'string'),
    ),
  );
};
