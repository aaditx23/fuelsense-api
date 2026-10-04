import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelPriceResponseDto } from '../../presentation/dto/fuel-price-response.dto';
import {
  FUEL_PRICE_REPOSITORY,
} from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';
import { detectPriceChanges } from '../../domain/services/detect-price-changes';
import { PRICE_ALERT_NOTIFIER } from '../../domain/services/price-alert-notifier';
import type { PriceAlertNotifier } from '../../domain/services/price-alert-notifier';
import { FuelPriceScraperService } from '../services/fuel-price-scraper.service';

@Injectable()
export class ManualFuelUpdateUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
    private readonly fuelPriceScraper: FuelPriceScraperService,
    @Inject(PRICE_ALERT_NOTIFIER)
    private readonly priceAlertNotifier: PriceAlertNotifier,
  ) {}
  async execute(): Promise<UnifiedResponse<FuelPriceResponseDto>> {
    const latest = await this.fuelPriceRepository.findLatest();
    if (latest) {
      const latestCheck = Math.max(
        latest.diesel.updatedAt.getTime(),
        latest.petrol.updatedAt.getTime(),
        latest.octane.updatedAt.getTime(),
      );
      const timeSinceLastUpdate = Date.now() - latestCheck;
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      if (timeSinceLastUpdate < sixHoursInMs) {
        return ok({
          message: 'Fuel price fetched from cache (last updated less than 6 hours ago)',
          data: FuelPriceResponseDto.fromEntity(latest),
        });
      }
    }

    const scraped = await this.fuelPriceScraper.scrape();

    if (
      scraped.diesel.price == null &&
      scraped.petrol.price == null &&
      scraped.octane.price == null
    ) {
      throw new BadRequestException('Unable to scrape fuel prices from source');
    }

    const result = await this.fuelPriceRepository.saveIfChanged({
      diesel: scraped.diesel,
      petrol: scraped.petrol,
      octane: scraped.octane,
    });

    // Devices subscribed to a fuel's topic are told when its price moved. The
    // notifier never throws, so a push problem cannot fail the update.
    await this.priceAlertNotifier.notify(
      detectPriceChanges(latest, result.record),
    );

    return ok({
      message: result.inserted
        ? 'Fuel price updated successfully'
        : 'No fuel price changes detected',
      data: FuelPriceResponseDto.fromEntity(result.record),
    });
  }
}
