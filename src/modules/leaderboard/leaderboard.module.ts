import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../shared/infrastructure/prisma/prisma.module';
import { RebuildBikeLeaderboardUseCase } from './application/use-cases/rebuild-bike-leaderboard.use-case';
import { LEADERBOARD_REPOSITORY } from './domain/repositories/leaderboard.repository';
import { PrismaLeaderboardRepository } from './infrastructure/repositories/prisma-leaderboard.repository';
import { StatsRebuildController } from './presentation/stats-rebuild.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [StatsRebuildController],
  providers: [
    RebuildBikeLeaderboardUseCase,
    {
      provide: LEADERBOARD_REPOSITORY,
      useClass: PrismaLeaderboardRepository,
    },
  ],
})
export class LeaderboardModule {}
