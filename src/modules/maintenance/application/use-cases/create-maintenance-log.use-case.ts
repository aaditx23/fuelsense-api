import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { CreateMaintenanceDto } from '../../presentation/dto/create-maintenance.dto';
import { MaintenanceRecordResponseDto } from '../../presentation/dto/maintenance-record-response.dto';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class CreateMaintenanceLogUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(
    userId: number,
    input: CreateMaintenanceDto,
  ): Promise<UnifiedResponse<MaintenanceRecordResponseDto>> {
    const isOwned = await this.maintenanceRepository.isUserBikeOwnedByUser(userId, input.userBikeId);
    if (!isOwned) {
      throw new ForbiddenException('You do not own this user bike');
    }

    if (input.odometerReading < 0) {
      throw new BadRequestException('Odometer reading cannot be negative');
    }

    const created = await this.maintenanceRepository.createMaintenanceRecord({
      userId,
      userBikeId: input.userBikeId,
      odometerReading: input.odometerReading,
      category: input.category,
      description: input.description,
      partsCost: input.partsCost,
      laborCost: input.laborCost,
      partsBrand: input.partsBrand,
      serviceDate: input.serviceDate ? new Date(input.serviceDate) : undefined,
    });

    return ok({
      message: 'Maintenance record created successfully',
      data: MaintenanceRecordResponseDto.fromEntity(created),
    });
  }
}
