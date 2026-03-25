import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { REFUEL_REPOSITORY } from '../../domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../domain/repositories/refuel.repository';
import { RefuelRecordResponseDto } from '../../presentation/dto/refuel-record-response.dto';

@Injectable()
export class GetRefuelRecordsUseCase {
  constructor(
    @Inject(REFUEL_REPOSITORY)
    private readonly refuelRepository: RefuelRepository,
  ) {}

  async execute(userId: number): Promise<UnifiedResponse<RefuelRecordResponseDto>> {
    const rows = await this.refuelRepository.getUserRefuelRecords(userId);

    return ok({
      message: rows.length > 0 ? 'Refuel records fetched successfully' : 'No refuel records found',
      listData: rows.map(RefuelRecordResponseDto.fromEntity),
    });
  }
}
