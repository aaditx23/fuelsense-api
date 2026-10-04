import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelTypeName } from '../../domain/entities/fuel-price.entity';
import { FUEL_PRICE_REPOSITORY } from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';
import { DEFAULT_HISTORY_DAYS } from '../../presentation/dto/fuel-price-history-query.dto';
import { FuelPriceHistoryPointDto } from '../../presentation/dto/fuel-price-history-point.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GetFuelPriceHistoryUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
  ) {}

  async execute(
    fuelType: FuelTypeName,
    days: number = DEFAULT_HISTORY_DAYS,
  ): Promise<UnifiedResponse<FuelPriceHistoryPointDto>> {
    const since = new Date(Date.now() - days * DAY_MS);
    const points = await this.fuelPriceRepository.findHistory(fuelType, since);

    return ok({
      message:
        points.length > 0
          ? 'Fuel price history fetched successfully'
          : 'No fuel price history found for this period',
      listData: points.map(FuelPriceHistoryPointDto.fromEntity),
    });
  }
}
