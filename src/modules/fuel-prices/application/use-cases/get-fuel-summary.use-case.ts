import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelPriceSummaryDto } from '../../presentation/dto/fuel-price-summary.dto';
import { FUEL_PRICE_REPOSITORY } from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';

@Injectable()
export class GetFuelSummaryUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<FuelPriceSummaryDto>> {
    const summary = await this.fuelPriceRepository.getSummary();

    return ok({
      message: 'Fuel summary fetched successfully',
      data: summary,
    });
  }
}
