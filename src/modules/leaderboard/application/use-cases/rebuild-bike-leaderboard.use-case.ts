import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { LEADERBOARD_REPOSITORY } from '../../domain/repositories/leaderboard.repository';
import type {
  LeaderboardRepository,
  LeaderboardStatRow,
} from '../../domain/repositories/leaderboard.repository';
import {
  bikeStats,
  LeaderboardPeriod,
} from '../../domain/services/leaderboard-calculator';

const PERIODS: LeaderboardPeriod[] = ['ALL', 'LAST_6M'];

export type RebuildSummary = { bikes: number; rows: number };

/**
 * Recomputes every bike model's ranking figures from what owners logged and
 * stores them, so reading the leaderboard never scans refuels. Run nightly, and
 * once on demand when the table is still empty.
 */
@Injectable()
export class RebuildBikeLeaderboardUseCase {
  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly leaderboardRepository: LeaderboardRepository,
  ) {}

  async execute(now: Date = new Date()): Promise<UnifiedResponse<RebuildSummary>> {
    const bikes = await this.leaderboardRepository.getBikeCatalog();

    const rows: LeaderboardStatRow[] = [];
    let bikesWithOwners = 0;
    for (const bike of bikes) {
      const owners = await this.leaderboardRepository.loadBikeActivity(bike.id);
      if (owners.length === 0) {
        continue;
      }
      bikesWithOwners++;

      for (const period of PERIODS) {
        const stats = bikeStats(owners, bike.expectedMileage, period, now);
        const hasFigures =
          stats.ownerCount > 0 ||
          stats.runningOwnerCount > 0 ||
          stats.maintenanceOwnerCount > 0;
        if (hasFigures) {
          rows.push({ bikeId: bike.id, period, updatedAt: now, ...stats });
        }
      }
    }

    await this.leaderboardRepository.replaceStats(rows);

    return ok({
      message: 'Bike leaderboard rebuilt successfully',
      data: { bikes: bikesWithOwners, rows: rows.length },
    });
  }
}
