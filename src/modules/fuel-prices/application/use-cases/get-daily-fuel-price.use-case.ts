import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelPriceResponseDto } from '../../presentation/dto/fuel-price-response.dto';
import { FUEL_PRICE_REPOSITORY } from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';

@Injectable()
export class GetDailyFuelPriceUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<FuelPriceResponseDto>> {
    const latest = await this.fuelPriceRepository.findLatest();

    if (!latest) {
      return ok<FuelPriceResponseDto>({
        message: 'No fuel price data found',
        data: null,
      });
    }

    return ok({
      message: 'Latest fuel price fetched successfully',
      data: FuelPriceResponseDto.fromEntity(latest),
    });
  }
}
