import { Module } from '@nestjs/common';
import { GetAllFuelPriceUseCase } from './application/use-cases/get-all-fuel-price.use-case';
import { GetDailyFuelPriceUseCase } from './application/use-cases/get-daily-fuel-price.use-case';
import { GetFuelSummaryUseCase } from './application/use-cases/get-fuel-summary.use-case';
import { ManualFuelUpdateUseCase } from './application/use-cases/manual-fuel-update.use-case';
import { FuelPriceScraperService } from './application/services/fuel-price-scraper.service';
import {
  FUEL_PRICE_REPOSITORY,
  FuelPriceRepository,
} from './domain/repositories/fuel-price.repository';
import { PrismaFuelPriceRepository } from './infrastructure/repositories/prisma-fuel-price.repository';
import { FuelPricesController } from './presentation/fuel-prices.controller';

@Module({
  controllers: [FuelPricesController],
  providers: [
    GetDailyFuelPriceUseCase,
    GetFuelSummaryUseCase,
    GetAllFuelPriceUseCase,
    ManualFuelUpdateUseCase,
    FuelPriceScraperService,
    {
      provide: FUEL_PRICE_REPOSITORY,
      useClass: PrismaFuelPriceRepository,
    },
  ],
})
export class FuelPricesModule {}
