import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { ADMIN_BIKE_REPOSITORY } from '../../domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class DeleteBikeUseCase {
  constructor(
    @Inject(ADMIN_BIKE_REPOSITORY)
    private readonly adminBikeRepository: AdminBikeRepository,
  ) {}

  async execute(bikeId: number): Promise<UnifiedResponse<null>> {
    const bike = await this.adminBikeRepository.findById(bikeId);
    if (!bike) {
      throw new NotFoundException('Bike not found');
    }

    await this.adminBikeRepository.deleteBike(bikeId);

    return ok<null>({
      message: 'Bike deleted successfully',
      data: null,
    });
  }
}
