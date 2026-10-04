import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { GetAllFuelPriceUseCase } from '../application/use-cases/get-all-fuel-price.use-case';
import { GetDailyFuelPriceUseCase } from '../application/use-cases/get-daily-fuel-price.use-case';
import { GetFuelPriceHistoryUseCase } from '../application/use-cases/get-fuel-price-history.use-case';
import { GetFuelSummaryUseCase } from '../application/use-cases/get-fuel-summary.use-case';
import { FuelPriceHistoryQueryDto } from './dto/fuel-price-history-query.dto';
import { SendTestPriceAlertUseCase } from '../application/use-cases/send-test-price-alert.use-case';
import { ManualFuelUpdateUseCase } from '../application/use-cases/manual-fuel-update.use-case';

@ApiTags('fuel-price')
@Controller('api/v1')
export class FuelPricesController {
  constructor(
    private readonly getDailyFuelPriceUseCase: GetDailyFuelPriceUseCase,
    private readonly getFuelSummaryUseCase: GetFuelSummaryUseCase,
    private readonly getAllFuelPriceUseCase: GetAllFuelPriceUseCase,
    private readonly getFuelPriceHistoryUseCase: GetFuelPriceHistoryUseCase,
    private readonly manualFuelUpdateUseCase: ManualFuelUpdateUseCase,
    private readonly sendTestPriceAlertUseCase: SendTestPriceAlertUseCase,
  ) {}

  @ApiOperation({ summary: 'Get Daily Fuel Price', description: 'Get latest fuel price record.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('daily-fuel')
  getDailyFuel() {
    return this.getDailyFuelPriceUseCase.execute();
  }

  @ApiOperation({ summary: 'Get Fuel Price Summary', description: 'Get average fuel prices summary.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('fuel-sum')
  getFuelSummary() {
    return this.getFuelSummaryUseCase.execute();
  }

  @ApiOperation({ summary: 'Get All Fuel Data', description: 'Get all stored fuel price records.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('all-fuel-data')
  getAllFuelData() {
    return this.getAllFuelPriceUseCase.execute();
  }

  @ApiOperation({
    summary: 'Get Fuel Price History',
    description: 'Prices of one fuel type over the last N days, oldest first.',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('fuel-prices/history')
  getFuelPriceHistory(@Query() query: FuelPriceHistoryQueryDto) {
    return this.getFuelPriceHistoryUseCase.execute(query.fuelType, query.days);
  }

  @ApiOperation({ summary: 'Trigger Manual Fuel Update', description: 'Trigger manual fuel scraping and persistence.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Post('manual-fuel-update')
  manualFuelUpdate() {
    return this.manualFuelUpdateUseCase.execute();
  }

  @ApiOperation({
    summary: 'Trigger Manual Fuel Update (cron)',
    description: 'Vercel Cron Jobs only send GET requests, so this mirrors the POST endpoint above for the scheduled job in vercel.json.',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @Get('manual-fuel-update')
  manualFuelUpdateCron() {
    return this.manualFuelUpdateUseCase.execute();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('HTTPBearer')
  @ApiOperation({
    summary: 'Send Test Price Alert',
    description: 'Admin only. Publishes a marked test message to the price-test topic.',
  })
  @ApiOkResponse({ description: 'Successful Response' })
  @Post('admin/fuel-prices/test-alert')
  sendTestPriceAlert() {
    return this.sendTestPriceAlertUseCase.execute();
  }
}
