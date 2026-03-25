import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BIKE_REPOSITORY } from '../../domain/repositories/bike.repository';
import type { BikeRepository } from '../../domain/repositories/bike.repository';
import { BikeResponseDto } from '../../presentation/dto/bike-response.dto';

@Injectable()
export class GetActiveBikesUseCase {
  constructor(
    @Inject(BIKE_REPOSITORY)
    private readonly bikeRepository: BikeRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<BikeResponseDto>> {
    const bikes = await this.bikeRepository.findActive();

    return ok({
      message: bikes.length > 0 ? 'Bikes fetched successfully' : 'No bikes found',
      listData: bikes.map(BikeResponseDto.fromEntity),
    });
  }
}
