import type { ReactNode } from 'react';

import type { AdResponse } from '../../models/types';

export function mapAdsOrSkeletons(params: {
  ads: AdResponse[];
  isDataLoading: boolean;
  skeletonKeys: number[];
  renderAd: (ad: AdResponse) => ReactNode;
  renderSkeleton: (skeletonKey: number) => ReactNode;
}): ReactNode {
  const { ads, isDataLoading, skeletonKeys, renderAd, renderSkeleton } = params;
  if (isDataLoading) {
    return skeletonKeys.map((k) => renderSkeleton(k));
  }
  return ads.map((ad) => renderAd(ad));
}
