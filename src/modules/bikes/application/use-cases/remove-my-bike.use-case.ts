import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BIKE_REPOSITORY } from '../../domain/repositories/bike.repository';
import type { BikeRepository } from '../../domain/repositories/bike.repository';

@Injectable()
export class RemoveMyBikeUseCase {
  constructor(
    @Inject(BIKE_REPOSITORY)
    private readonly bikeRepository: BikeRepository,
  ) {}

  async execute(userId: number, bikeId: number): Promise<UnifiedResponse<null>> {
    const removed = await this.bikeRepository.removeBikeSelection(userId, bikeId);

    return ok<null>({
      message: removed ? 'Bike removed successfully' : 'Bike already removed',
      data: null,
    });
  }
}
