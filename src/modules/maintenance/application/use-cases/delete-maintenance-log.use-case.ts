import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class DeleteMaintenanceLogUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(userId: number, id: number): Promise<UnifiedResponse<null>> {
    const existing = await this.maintenanceRepository.findOwnedRecord(userId, id);
    if (!existing) {
      throw new NotFoundException('Maintenance record not found');
    }

    await this.maintenanceRepository.deleteMaintenanceRecord(id);

    return ok({ message: 'Maintenance record deleted successfully' });
  }
}
