import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BIKE_REPOSITORY } from '../../domain/repositories/bike.repository';
import type { BikeRepository } from '../../domain/repositories/bike.repository';
import { BikeResponseDto } from '../../presentation/dto/bike-response.dto';

@Injectable()
export class GetMyBikesUseCase {
  constructor(
    @Inject(BIKE_REPOSITORY)
    private readonly bikeRepository: BikeRepository,
  ) {}

  async execute(userId: number): Promise<UnifiedResponse<BikeResponseDto>> {
    const bikes = await this.bikeRepository.findMyActiveBikes(userId);

    return ok({
      message: bikes.length > 0 ? 'My bikes fetched successfully' : 'No bikes found',
      listData: bikes.map(BikeResponseDto.fromEntity),
    });
  }
}
