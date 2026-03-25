import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BikeResponseDto } from '../../../bikes/presentation/dto/bike-response.dto';
import { ADMIN_BIKE_REPOSITORY } from '../../domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class GetPendingBikesUseCase {
  constructor(
    @Inject(ADMIN_BIKE_REPOSITORY)
    private readonly adminBikeRepository: AdminBikeRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<BikeResponseDto>> {
    const bikes = await this.adminBikeRepository.findPending();

    return ok({
      message: bikes.length > 0 ? 'Pending bikes fetched successfully' : 'No pending bikes found',
      listData: bikes.map(BikeResponseDto.fromEntity),
    });
  }
}
