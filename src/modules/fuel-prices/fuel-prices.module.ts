import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetAllFuelPriceUseCase } from './application/use-cases/get-all-fuel-price.use-case';
import { SendTestPriceAlertUseCase } from './application/use-cases/send-test-price-alert.use-case';
import { GetFuelPriceHistoryUseCase } from './application/use-cases/get-fuel-price-history.use-case';
import { GetDailyFuelPriceUseCase } from './application/use-cases/get-daily-fuel-price.use-case';
import { GetFuelSummaryUseCase } from './application/use-cases/get-fuel-summary.use-case';
import { ManualFuelUpdateUseCase } from './application/use-cases/manual-fuel-update.use-case';
import { FuelPriceScraperService } from './application/services/fuel-price-scraper.service';
import {
  FUEL_PRICE_REPOSITORY,
  FuelPriceRepository,
} from './domain/repositories/fuel-price.repository';
import { PRICE_ALERT_NOTIFIER } from './domain/services/price-alert-notifier';
import { FirebasePriceAlertNotifier } from './infrastructure/notifications/firebase-price-alert-notifier';
import { PrismaFuelPriceRepository } from './infrastructure/repositories/prisma-fuel-price.repository';
import { FuelPricesController } from './presentation/fuel-prices.controller';

@Module({
  imports: [AuthModule],
  controllers: [FuelPricesController],
  providers: [
    GetDailyFuelPriceUseCase,
    GetFuelSummaryUseCase,
    GetAllFuelPriceUseCase,
    GetFuelPriceHistoryUseCase,
    ManualFuelUpdateUseCase,
    SendTestPriceAlertUseCase,
    FuelPriceScraperService,
    {
      provide: PRICE_ALERT_NOTIFIER,
      useClass: FirebasePriceAlertNotifier,
    },
    {
      provide: FUEL_PRICE_REPOSITORY,
      useClass: PrismaFuelPriceRepository,
    },
  ],
})
export class FuelPricesModule {}
