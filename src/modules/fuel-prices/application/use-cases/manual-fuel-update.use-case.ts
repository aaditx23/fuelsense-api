import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelPriceResponseDto } from '../../presentation/dto/fuel-price-response.dto';
import {
  FUEL_PRICE_REPOSITORY,
} from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';
import { FuelPriceScraperService } from '../services/fuel-price-scraper.service';

@Injectable()
export class ManualFuelUpdateUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
    private readonly fuelPriceScraper: FuelPriceScraperService,
  ) {}

  async execute(): Promise<UnifiedResponse<FuelPriceResponseDto>> {
    const scraped = await this.fuelPriceScraper.scrape();

    if (
      scraped.diesel == null &&
      scraped.petrol == null &&
      scraped.octane == null
    ) {
      throw new BadRequestException('Unable to scrape fuel prices from source');
    }

    const result = await this.fuelPriceRepository.saveIfChanged({
      date: new Date(),
      diesel: scraped.diesel,
      petrol: scraped.petrol,
      octane: scraped.octane,
    });

    return ok({
      message: result.inserted
        ? 'Fuel price updated successfully'
        : 'No fuel price changes detected',
      data: FuelPriceResponseDto.fromEntity(result.record),
    });
  }
}
