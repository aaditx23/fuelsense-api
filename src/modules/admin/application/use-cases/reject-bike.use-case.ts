import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { ADMIN_BIKE_REPOSITORY } from '../../domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class RejectBikeUseCase {
  constructor(
    @Inject(ADMIN_BIKE_REPOSITORY)
    private readonly adminBikeRepository: AdminBikeRepository,
  ) {}

  async execute(bikeId: number): Promise<UnifiedResponse<null>> {
    const bike = await this.adminBikeRepository.findById(bikeId);
    if (!bike) {
      throw new NotFoundException('Bike not found');
    }

    if (bike.isActive) {
      throw new BadRequestException('Only pending bikes can be rejected');
    }

    await this.adminBikeRepository.deleteBike(bikeId);

    return ok<null>({
      message: 'Bike rejected and deleted successfully',
      data: null,
    });
  }
}
