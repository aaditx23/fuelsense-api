import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { CompleteRefuelDto } from '../../presentation/dto/complete-refuel.dto';
import { RefuelRecordResponseDto } from '../../presentation/dto/refuel-record-response.dto';
import { REFUEL_REPOSITORY } from '../../domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../domain/repositories/refuel.repository';

/** Turns a RESERVE_INCOMPLETE marker into a RESERVE_COMPLETE refuel. */
@Injectable()
export class CompleteRefuelRecordUseCase {
  constructor(
    @Inject(REFUEL_REPOSITORY)
    private readonly refuelRepository: RefuelRepository,
  ) {}

  async execute(
    userId: number,
    id: number,
    input: CompleteRefuelDto,
  ): Promise<UnifiedResponse<RefuelRecordResponseDto>> {
    if (input.fuelLiter == null && input.fuelPrice == null) {
      throw new BadRequestException('At least one of fuelLiter or fuelPrice is required');
    }

    if (input.odometerReading == null && input.tripMeterReading == null) {
      throw new BadRequestException(
        'At least one of odometerReading or tripMeterReading is required',
      );
    }

    const record = await this.refuelRepository.findOwnedRecord(userId, id);
    if (!record) {
      throw new NotFoundException('Refuel record not found');
    }

    if (record.entryType !== 'RESERVE_INCOMPLETE') {
      throw new ConflictException('Only an incomplete reserve entry can be completed');
    }

    const completed = await this.refuelRepository.completeReserveRecord(id, {
      odometerReading: input.odometerReading,
      tripMeterReading: input.tripMeterReading,
      fuelLiter: input.fuelLiter,
      fuelPrice: input.fuelPrice,
    });

    return ok({
      message: 'Refuel record completed successfully',
      data: RefuelRecordResponseDto.fromEntity(completed),
    });
  }
}
