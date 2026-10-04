import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { GetBikeLeaderboardPositionUseCase } from '../application/use-cases/get-bike-leaderboard-position.use-case';
import { GetBikeLeaderboardUseCase } from '../application/use-cases/get-bike-leaderboard.use-case';
import {
  LeaderboardPositionQueryDto,
  LeaderboardQueryDto,
} from './dto/leaderboard-query.dto';

@ApiTags('community')
@ApiBearerAuth('HTTPBearer')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/community/leaderboard')
export class LeaderboardController {
  constructor(
    private readonly getBikeLeaderboardUseCase: GetBikeLeaderboardUseCase,
    private readonly getBikeLeaderboardPositionUseCase: GetBikeLeaderboardPositionUseCase,
  ) {}

  @ApiOperation({
    summary: 'Bike leaderboard',
    description:
      'Bike models ranked on one metric (mileage, claim vs reality, running cost, maintenance cost). Models with too few owners are listed unranked at the end.',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get()
  getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.getBikeLeaderboardUseCase.execute(query);
  }

  @ApiOperation({
    summary: 'Position of one bike model on the leaderboard',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('position')
  getPosition(@Query() query: LeaderboardPositionQueryDto) {
    return this.getBikeLeaderboardPositionUseCase.execute(
      query.bikeId,
      query.metric,
      query.period,
    );
  }
}
