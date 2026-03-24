import { ScrollArea, Stack } from '@mantine/core';

import type { AdResponse } from '../../models/types';
import { AdListCard } from '../ad-cards';
import { AdListSkeletonCard } from '../ads-loading-skeletons';
import { mapAdsOrSkeletons } from './ads-collection-items';

export type AdsListProps = {
  ads: AdResponse[];
  isDataLoading: boolean;
  skeletonKeys: number[];
};

export function AdsList({ ads, isDataLoading, skeletonKeys }: AdsListProps) {
  return (
    <ScrollArea h={650}>
      <Stack>
        {mapAdsOrSkeletons({
          ads,
          isDataLoading,
          skeletonKeys,
          renderAd: (ad) => <AdListCard key={ad.id} ad={ad} />,
          renderSkeleton: (id) => <AdListSkeletonCard key={id} />,
        })}
      </Stack>
    </ScrollArea>
  );
}
