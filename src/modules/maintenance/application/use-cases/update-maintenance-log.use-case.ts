import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { UpdateMaintenanceDto } from '../../presentation/dto/update-maintenance.dto';
import { MaintenanceRecordResponseDto } from '../../presentation/dto/maintenance-record-response.dto';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';
import { normalizeBrand } from '../../domain/services/brand-normalizer';

@Injectable()
export class UpdateMaintenanceLogUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(
    userId: number,
    id: number,
    input: UpdateMaintenanceDto,
  ): Promise<UnifiedResponse<MaintenanceRecordResponseDto>> {
    const hasChange = Object.values(input).some((value) => value !== undefined);
    if (!hasChange) {
      throw new BadRequestException('At least one field to update is required');
    }

    const serviceDate = input.serviceDate ? new Date(input.serviceDate) : undefined;
    if (serviceDate && Number.isNaN(serviceDate.getTime())) {
      throw new BadRequestException('serviceDate must be a valid date');
    }

    const category = input.category?.trim();
    if (input.category !== undefined && !category) {
      throw new BadRequestException('Category cannot be empty');
    }

    const existing = await this.maintenanceRepository.findOwnedRecord(userId, id);
    if (!existing) {
      throw new NotFoundException('Maintenance record not found');
    }

    const updated = await this.maintenanceRepository.updateMaintenanceRecord(id, {
      odometerReading: input.odometerReading,
      category,
      description: input.description,
      partsCost: input.partsCost,
      laborCost: input.laborCost,
      // undefined leaves the brand alone; blank or null clears it.
      partsBrand:
        input.partsBrand === undefined
          ? undefined
          : normalizeBrand(input.partsBrand),
      serviceDate,
    });

    return ok({
      message: 'Maintenance record updated successfully',
      data: MaintenanceRecordResponseDto.fromEntity(updated),
    });
  }
}
