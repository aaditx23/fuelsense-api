import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { COMMUNITY_REPOSITORY } from '../../domain/repositories/community.repository';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import {
  CategoryBrandInsights,
  computeBrandInsights,
  MIN_BRAND_RIDERS,
  MIN_BRAND_SAMPLES,
} from '../../domain/services/brand-insights';

export type BikeBrandInsightsEntity = {
  bikeId: number;
  minRiders: number;
  minSamples: number;
  categories: CategoryBrandInsights[];
};

@Injectable()
export class GetBikeBrandInsightsUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
  ) {}

  async execute(
    bikeId: number,
  ): Promise<UnifiedResponse<BikeBrandInsightsEntity>> {
    const bike = await this.communityRepository.getBikeById(bikeId);
    if (!bike) {
      throw new NotFoundException('Bike not found');
    }

    const rows = await this.communityRepository.getBikeMaintenanceRecords(bikeId);

    return ok({
      message: 'Brand insights fetched successfully',
      data: {
        bikeId,
        minRiders: MIN_BRAND_RIDERS,
        minSamples: MIN_BRAND_SAMPLES,
        categories: computeBrandInsights(rows),
      },
    });
  }
}
