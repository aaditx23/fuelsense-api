import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { MaintenanceRecordResponseDto } from '../../presentation/dto/maintenance-record-response.dto';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class GetMaintenanceLogsUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(userId: number): Promise<UnifiedResponse<MaintenanceRecordResponseDto[]>> {
    const logs = await this.maintenanceRepository.getUserMaintenanceLogs(userId);
    const data = logs.map((log) => MaintenanceRecordResponseDto.fromEntity(log));

    return ok({
      message: 'Maintenance records retrieved successfully',
      data,
    });
  }
}
