import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { LEADERBOARD_REPOSITORY } from '../../domain/repositories/leaderboard.repository';
import type { LeaderboardRepository } from '../../domain/repositories/leaderboard.repository';
import { MIN_RANKED_OWNERS } from '../../domain/services/leaderboard-calculator';
import {
  LeaderboardMetric,
  rankBikes,
} from '../../domain/services/leaderboard-ranking';
import { periodOf } from './get-bike-leaderboard.use-case';

export type LeaderboardPosition = {
  bikeId: number;
  metric: LeaderboardMetric;
  /** Place among ranked models, or null when the model is not ranked yet. */
  rank: number | null;
  totalRanked: number;
  ownerCount: number;
  minOwners: number;
  value: number | null;
};

/** Where one bike model stands on a metric, among every model. */
@Injectable()
export class GetBikeLeaderboardPositionUseCase {
  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly leaderboardRepository: LeaderboardRepository,
  ) {}

  async execute(
    bikeId: number,
    metric: LeaderboardMetric,
    period?: 'all' | '6m',
  ): Promise<UnifiedResponse<LeaderboardPosition>> {
    const rows = await this.leaderboardRepository.findStats(periodOf(period));
    const entries = rankBikes(rows, metric);
    const own = entries.find((entry) => entry.bike.id === bikeId);

    return ok({
      message: 'Bike leaderboard position fetched successfully',
      data: {
        bikeId,
        metric,
        rank: own?.rank ?? null,
        totalRanked: entries.filter((entry) => entry.ranked).length,
        ownerCount: own?.ownerCount ?? 0,
        minOwners: MIN_RANKED_OWNERS,
        value: own?.value ?? null,
      },
    });
  }
}
