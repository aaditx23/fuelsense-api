import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CronSecretGuard } from '../../../common/auth/cron-secret.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { RebuildBikeLeaderboardUseCase } from '../application/use-cases/rebuild-bike-leaderboard.use-case';

@ApiTags('stats')
@Controller('api/v1')
export class StatsRebuildController {
  constructor(
    private readonly rebuildBikeLeaderboardUseCase: RebuildBikeLeaderboardUseCase,
  ) {}

  @ApiOperation({
    summary: 'Rebuild community statistics (cron)',
    description:
      'Called by the scheduler with the cron secret. Vercel Cron only sends GET.',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(CronSecretGuard)
  @Get('stats/rebuild')
  rebuildFromCron() {
    return this.rebuildBikeLeaderboardUseCase.execute();
  }

  @ApiOperation({
    summary: 'Rebuild community statistics (admin)',
    description: 'Admin only. Recomputes the bike leaderboard now.',
  })
  @ApiBearerAuth('HTTPBearer')
  @ApiOkResponse({ description: 'Successful Response' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/stats/rebuild')
  rebuildAsAdmin() {
    return this.rebuildBikeLeaderboardUseCase.execute();
  }
}
