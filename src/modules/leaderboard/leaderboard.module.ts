import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../shared/infrastructure/prisma/prisma.module';
import { GetBikeLeaderboardPositionUseCase } from './application/use-cases/get-bike-leaderboard-position.use-case';
import { GetBikeLeaderboardUseCase } from './application/use-cases/get-bike-leaderboard.use-case';
import { RebuildBikeLeaderboardUseCase } from './application/use-cases/rebuild-bike-leaderboard.use-case';
import { LEADERBOARD_REPOSITORY } from './domain/repositories/leaderboard.repository';
import { PrismaLeaderboardRepository } from './infrastructure/repositories/prisma-leaderboard.repository';
import { LeaderboardController } from './presentation/leaderboard.controller';
import { StatsRebuildController } from './presentation/stats-rebuild.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [LeaderboardController, StatsRebuildController],
  providers: [
    RebuildBikeLeaderboardUseCase,
    GetBikeLeaderboardUseCase,
    GetBikeLeaderboardPositionUseCase,
    {
      provide: LEADERBOARD_REPOSITORY,
      useClass: PrismaLeaderboardRepository,
    },
  ],
})
export class LeaderboardModule {}
