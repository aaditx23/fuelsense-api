import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import {
  BIKE_REPOSITORY,
} from '../../domain/repositories/bike.repository';
import type {
  BikeRepository,
  SubmitBikeInput,
} from '../../domain/repositories/bike.repository';
import { BikeResponseDto } from '../../presentation/dto/bike-response.dto';

@Injectable()
export class SubmitBikeUseCase {
  constructor(
    @Inject(BIKE_REPOSITORY)
    private readonly bikeRepository: BikeRepository,
  ) {}

  async execute(input: SubmitBikeInput): Promise<UnifiedResponse<BikeResponseDto>> {
    const existing = await this.bikeRepository.findByVariant({
      brand: input.brand,
      model: input.model,
      engineCc: input.engineCc,
      modelYear: input.modelYear,
    });

    if (existing) {
      const message = existing.isActive
        ? 'Bike already exists'
        : 'Bike already exists and is pending approval';

      return ok({
        message,
        data: BikeResponseDto.fromEntity(existing),
      });
    }

    const bike = await this.bikeRepository.createPending(input);
    return ok({
      message: 'Bike submitted for approval',
      data: BikeResponseDto.fromEntity(bike),
    });
  }
}
