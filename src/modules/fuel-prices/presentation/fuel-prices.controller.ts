import { Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetAllFuelPriceUseCase } from '../application/use-cases/get-all-fuel-price.use-case';
import { GetDailyFuelPriceUseCase } from '../application/use-cases/get-daily-fuel-price.use-case';
import { GetFuelSummaryUseCase } from '../application/use-cases/get-fuel-summary.use-case';
import { ManualFuelUpdateUseCase } from '../application/use-cases/manual-fuel-update.use-case';

@ApiTags('fuel-price')
@Controller('api/v1')
export class FuelPricesController {
  constructor(
    private readonly getDailyFuelPriceUseCase: GetDailyFuelPriceUseCase,
    private readonly getFuelSummaryUseCase: GetFuelSummaryUseCase,
    private readonly getAllFuelPriceUseCase: GetAllFuelPriceUseCase,
    private readonly manualFuelUpdateUseCase: ManualFuelUpdateUseCase,
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

  @ApiOperation({ summary: 'Trigger Manual Fuel Update', description: 'Trigger manual fuel scraping and persistence.' })
  @ApiOkResponse({ description: 'Successful Response' })
  @Post('manual-fuel-update')
  manualFuelUpdate() {
    return this.manualFuelUpdateUseCase.execute();
  }
}
