import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BikeResponseDto } from '../../../bikes/presentation/dto/bike-response.dto';
import { ADMIN_BIKE_REPOSITORY } from '../../domain/repositories/admin-bike.repository';
import type {
  AdminBikeRepository,
  EditBikeInput,
} from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class EditBikeUseCase {
  constructor(
    @Inject(ADMIN_BIKE_REPOSITORY)
    private readonly adminBikeRepository: AdminBikeRepository,
  ) {}

  async execute(
    bikeId: number,
    input: EditBikeInput,
  ): Promise<UnifiedResponse<BikeResponseDto>> {
    const existing = await this.adminBikeRepository.findById(bikeId);
    if (!existing) {
      throw new NotFoundException('Bike not found');
    }

    const updated = await this.adminBikeRepository.updateBike(bikeId, input);

    return ok({
      message: 'Bike updated successfully',
      data: BikeResponseDto.fromEntity(updated),
    });
  }
}
