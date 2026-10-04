import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { LEADERBOARD_REPOSITORY } from '../../domain/repositories/leaderboard.repository';
import type { LeaderboardRepository } from '../../domain/repositories/leaderboard.repository';
import type { LeaderboardPeriod } from '../../domain/services/leaderboard-calculator';
import { MIN_RANKED_OWNERS } from '../../domain/services/leaderboard-calculator';
import {
  LeaderboardEntry,
  LeaderboardFilter,
  LeaderboardMetric,
  rankBikes,
} from '../../domain/services/leaderboard-ranking';
import {
  DEFAULT_LEADERBOARD_PAGE,
  MAX_LEADERBOARD_PAGE,
} from '../../presentation/dto/leaderboard-query.dto';
import { RebuildBikeLeaderboardUseCase } from './rebuild-bike-leaderboard.use-case';

export type LeaderboardQuery = LeaderboardFilter & {
  metric: LeaderboardMetric;
  period?: 'all' | '6m';
  limit?: number;
  offset?: number;
};

export type LeaderboardPage = {
  metric: LeaderboardMetric;
  period: 'all' | '6m';
  /** Owners a model needs before it is ranked. */
  minOwners: number;
  /** Models matching the filters, ranked or not. */
  total: number;
  /** How many of those are ranked. */
  totalRanked: number;
  entries: LeaderboardEntry[];
  updatedAt: Date | null;
};

/** Do not retry an automatic rebuild more often than this. */
const AUTO_REBUILD_RETRY_MS = 10 * 60 * 1000;

export const periodOf = (period?: 'all' | '6m'): LeaderboardPeriod =>
  period === '6m' ? 'LAST_6M' : 'ALL';

@Injectable()
export class GetBikeLeaderboardUseCase {
  private lastAutoRebuildAt = 0;

  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly leaderboardRepository: LeaderboardRepository,
    private readonly rebuildUseCase: RebuildBikeLeaderboardUseCase,
  ) {}

  async execute(query: LeaderboardQuery): Promise<UnifiedResponse<LeaderboardPage>> {
    await this.ensureBuilt();

    const period = query.period ?? 'all';
    const rows = await this.leaderboardRepository.findStats(periodOf(period));
    const entries = rankBikes(rows, query.metric, query);

    const limit = Math.min(query.limit ?? DEFAULT_LEADERBOARD_PAGE, MAX_LEADERBOARD_PAGE);
    const offset = query.offset ?? 0;
    const updatedAt = rows.reduce<Date | null>(
      (latest, row) => (!latest || row.updatedAt > latest ? row.updatedAt : latest),
      null,
    );

    return ok({
      message: 'Bike leaderboard fetched successfully',
      data: {
        metric: query.metric,
        period,
        minOwners: MIN_RANKED_OWNERS,
        total: entries.length,
        totalRanked: entries.filter((entry) => entry.ranked).length,
        entries: entries.slice(offset, offset + limit),
        updatedAt,
      },
    });
  }

  /** Builds the table on first use so the leaderboard works before the first cron run. */
  private async ensureBuilt(): Promise<void> {
    if (
      (await this.leaderboardRepository.countStats()) > 0 ||
      Date.now() - this.lastAutoRebuildAt < AUTO_REBUILD_RETRY_MS
    ) {
      return;
    }
    this.lastAutoRebuildAt = Date.now();
    await this.rebuildUseCase.execute();
  }
}
