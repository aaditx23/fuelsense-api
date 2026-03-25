import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { FuelPriceResponseDto } from '../../presentation/dto/fuel-price-response.dto';
import { FUEL_PRICE_REPOSITORY } from '../../domain/repositories/fuel-price.repository';
import type { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';

@Injectable()
export class GetAllFuelPriceUseCase {
  constructor(
    @Inject(FUEL_PRICE_REPOSITORY)
    private readonly fuelPriceRepository: FuelPriceRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<FuelPriceResponseDto>> {
    const rows = await this.fuelPriceRepository.findAll();

    return ok({
      message: rows.length > 0 ? 'Fuel prices fetched successfully' : 'No fuel price data found',
      listData: rows.map(FuelPriceResponseDto.fromEntity),
    });
  }
}
