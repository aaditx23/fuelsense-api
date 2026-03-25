import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BikeResponseDto } from '../../../bikes/presentation/dto/bike-response.dto';
import { ADMIN_BIKE_REPOSITORY } from '../../domain/repositories/admin-bike.repository';
import type { AdminBikeRepository } from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class ApproveBikeUseCase {
  constructor(
    @Inject(ADMIN_BIKE_REPOSITORY)
    private readonly adminBikeRepository: AdminBikeRepository,
  ) {}

  async execute(bikeId: number): Promise<UnifiedResponse<BikeResponseDto>> {
    const bike = await this.adminBikeRepository.findById(bikeId);
    if (!bike) {
      throw new NotFoundException('Bike not found');
    }

    if (bike.isActive) {
      throw new BadRequestException('Bike is already active');
    }

    const duplicate = await this.adminBikeRepository.findActiveByVariantExcludingId({
      bikeId,
      brand: bike.brand,
      model: bike.model,
      engineCc: bike.engineCc,
      modelYear: bike.modelYear,
    });

    if (duplicate) {
      throw new ConflictException('An active bike with this variant already exists');
    }

    const approved = await this.adminBikeRepository.activateBike(bikeId);

    return ok({
      message: 'Bike approved successfully',
      data: BikeResponseDto.fromEntity(approved),
    });
  }
}
