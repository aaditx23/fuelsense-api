import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { GetCommunityBikesUseCase } from '../application/use-cases/get-community-bikes.use-case';
import { GetBikeBrandInsightsUseCase } from '../application/use-cases/get-bike-brand-insights.use-case';
import { GetBikeCommunityProfileUseCase } from '../application/use-cases/get-bike-community-profile.use-case';

@ApiTags('community')
@ApiBearerAuth('HTTPBearer')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/community')
export class CommunityController {
  constructor(
    private readonly getCommunityBikesUseCase: GetCommunityBikesUseCase,
    private readonly getBikeCommunityProfileUseCase: GetBikeCommunityProfileUseCase,
    private readonly getBikeBrandInsightsUseCase: GetBikeBrandInsightsUseCase,
  ) {}

  @ApiOperation({ summary: 'List community bikes with stats' })
  @ApiOkResponse({ description: 'Paginated active bikes with avg mileage + owner count' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('bikes')
  listBikes(
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.getCommunityBikesUseCase.execute(search, parseInt(page), parseInt(limit));
  }

  @ApiOperation({ summary: 'Get community profile for a bike model' })
  @ApiOkResponse({ description: 'Mileage range, parts cost, brand breakdown, change intervals' })
  @Get('bikes/:bikeId')
  getBikeProfile(@Param('bikeId', ParseIntPipe) bikeId: number) {
    return this.getBikeCommunityProfileUseCase.execute(bikeId);
  }

  @ApiOperation({ summary: 'Get part brand insights for a bike model' })
  @ApiOkResponse({
    description:
      'Per part category, the brands riders of this model use ranked by cost per 1,000 km, with how long each lasts. Brands with too little data are left out.',
  })
  @Get('bikes/:bikeId/brand-insights')
  getBrandInsights(@Param('bikeId', ParseIntPipe) bikeId: number) {
    return this.getBikeBrandInsightsUseCase.execute(bikeId);
  }
}
