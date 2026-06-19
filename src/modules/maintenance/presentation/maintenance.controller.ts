import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CreateMaintenanceLogUseCase } from '../application/use-cases/create-maintenance-log.use-case';
import { GetMaintenanceLogsUseCase } from '../application/use-cases/get-maintenance-logs.use-case';
import { GetBikeAnalyticsUseCase } from '../application/use-cases/get-bike-analytics.use-case';
import { GetRegisteredPartsUseCase } from '../application/use-cases/get-registered-parts.use-case';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@ApiTags('maintenance')
@Controller()
export class MaintenanceController {
  constructor(
    private readonly createMaintenanceLogUseCase: CreateMaintenanceLogUseCase,
    private readonly getMaintenanceLogsUseCase: GetMaintenanceLogsUseCase,
    private readonly getBikeAnalyticsUseCase: GetBikeAnalyticsUseCase,
    private readonly getRegisteredPartsUseCase: GetRegisteredPartsUseCase,
  ) {}

  @ApiOperation({ summary: 'Create Maintenance Log', description: 'Create a new maintenance log for the authenticated user.' })
  @ApiBearerAuth('HTTPBearer')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateMaintenanceDto })
  @ApiOkResponse({ description: 'Successful Response' })
  @Post('api/v1/maintenance')
  createRecord(@CurrentUser() user: AuthUser, @Body() dto: CreateMaintenanceDto) {
    return this.createMaintenanceLogUseCase.execute(user.userId, dto);
  }

  @ApiOperation({ summary: 'Get Maintenance Logs', description: 'Get all maintenance logs for the authenticated user.' })
  @ApiBearerAuth('HTTPBearer')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('api/v1/maintenance')
  getRecords(@CurrentUser() user: AuthUser) {
    return this.getMaintenanceLogsUseCase.execute(user.userId);
  }

  @ApiOperation({ summary: 'Get Bike Catalog Scorecard Analytics', description: 'Get aggregated community stats for a specific bike model.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('api/v1/bikes/:bikeId/analytics')
  getBikeAnalytics(@Param('bikeId', ParseIntPipe) bikeId: number) {
    return this.getBikeAnalyticsUseCase.execute(bikeId);
  }

  @ApiOperation({ summary: 'Get Registered Parts', description: 'Get all unique part names logged in the system.' })
  @ApiBearerAuth('HTTPBearer')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('api/v1/maintenance/parts')
  getParts() {
    return this.getRegisteredPartsUseCase.execute();
  }
}
