import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { REFUEL_REPOSITORY } from '../../domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../domain/repositories/refuel.repository';

@Injectable()
export class DeleteRefuelRecordUseCase {
  constructor(
    @Inject(REFUEL_REPOSITORY)
    private readonly refuelRepository: RefuelRepository,
  ) {}

  async execute(userId: number, id: number): Promise<UnifiedResponse<null>> {
    const record = await this.refuelRepository.findOwnedRecord(userId, id);
    if (!record) {
      throw new NotFoundException('Refuel record not found');
    }

    await this.refuelRepository.deleteRefuelRecord(id);

    return ok({ message: 'Refuel record deleted successfully' });
  }
}
