import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class GetRegisteredPartsUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(): Promise<UnifiedResponse<string[]>> {
    const parts = await this.maintenanceRepository.getRegisteredParts();
    return ok({
      message: 'Registered parts catalog fetched successfully',
      data: parts,
    });
  }
}
