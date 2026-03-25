import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BIKE_REPOSITORY } from '../../domain/repositories/bike.repository';
import type { BikeRepository } from '../../domain/repositories/bike.repository';

@Injectable()
export class SelectBikeUseCase {
  constructor(
    @Inject(BIKE_REPOSITORY)
    private readonly bikeRepository: BikeRepository,
  ) {}

  async execute(userId: number, bikeId: number): Promise<UnifiedResponse<null>> {
    const bike = await this.bikeRepository.findById(bikeId);
    if (!bike || !bike.isActive) {
      throw new NotFoundException('Bike not found');
    }

    const alreadySelected = await this.bikeRepository.hasUserBikeSelection(userId, bikeId);
    if (alreadySelected) {
      return ok<null>({
        message: 'Bike already selected',
        data: null,
      });
    }

    await this.bikeRepository.selectBike(userId, bikeId);

    return ok<null>({
      message: 'Bike selected successfully',
      data: null,
    });
  }
}
