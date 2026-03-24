import { SimpleGrid } from '@mantine/core';

import type { AdResponse } from '../../models/types';
import { AdGridCard } from '../ad-cards';
import { AdGridSkeletonCard } from '../ads-loading-skeletons';
import { mapAdsOrSkeletons } from './ads-collection-items';

export type AdsGridProps = {
  ads: AdResponse[];
  isDataLoading: boolean;
  skeletonKeys: number[];
};

export function AdsGrid({ ads, isDataLoading, skeletonKeys }: AdsGridProps) {
  return (
    <SimpleGrid cols={5} h={650}>
      {mapAdsOrSkeletons({
        ads,
        isDataLoading,
        skeletonKeys,
        renderAd: (ad) => <AdGridCard key={ad.id} ad={ad} />,
        renderSkeleton: (id) => <AdGridSkeletonCard key={id} />,
      })}
    </SimpleGrid>
  );
}
