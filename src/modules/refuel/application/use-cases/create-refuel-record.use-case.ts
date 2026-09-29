import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { RefuelEntryType } from '../../domain/entities/refuel-record.entity';
import { CreateRefuelDto } from '../../presentation/dto/create-refuel.dto';
import { RefuelRecordResponseDto } from '../../presentation/dto/refuel-record-response.dto';
import { REFUEL_REPOSITORY } from '../../domain/repositories/refuel.repository';
import type { RefuelRepository } from '../../domain/repositories/refuel.repository';

@Injectable()
export class CreateRefuelRecordUseCase {
  constructor(
    @Inject(REFUEL_REPOSITORY)
    private readonly refuelRepository: RefuelRepository,
  ) {}

  async execute(
    userId: number,
    input: CreateRefuelDto,
  ): Promise<UnifiedResponse<RefuelRecordResponseDto>> {
    const entryType = this.resolveEntryType(input);
    const isReserveMarker = entryType === 'RESERVE_INCOMPLETE';

    if (isReserveMarker) {
      this.validateReserveMarker(input);
    } else if (input.fuelLiter == null && input.fuelPrice == null) {
      throw new BadRequestException('At least one of fuelLiter or fuelPrice is required');
    }

    const isOwned = await this.refuelRepository.isUserBikeOwnedByUser(userId, input.userBikeId);
    if (!isOwned) {
      throw new ForbiddenException('You do not own this user bike');
    }

    if (isReserveMarker) {
      const hasOpenMarker = await this.refuelRepository.hasIncompleteReserve(
        userId,
        input.userBikeId,
      );
      if (hasOpenMarker) {
        throw new ConflictException('An incomplete reserve entry already exists for this bike');
      }
    }

    const refuelCount = await this.refuelRepository.countByUserBike(userId, input.userBikeId);
    const isFirstRefuel = refuelCount === 0;

    if (isReserveMarker) {
      if (isFirstRefuel && input.odometerAtReserve == null) {
        throw new BadRequestException('odometerAtReserve is required for first refuel');
      }
    } else {
      if (isFirstRefuel && input.odometerReading == null) {
        throw new BadRequestException('odometerReading is required for first refuel');
      }

      if (!isFirstRefuel && input.odometerReading == null && input.tripMeterReading == null) {
        throw new BadRequestException(
          'At least one of odometerReading or tripMeterReading is required',
        );
      }
    }

    const created = await this.refuelRepository.createRefuelRecord({
      userId,
      userBikeId: input.userBikeId,
      entryType,
      odometerReading: input.odometerReading,
      tripMeterReading: input.tripMeterReading,
      tripMeterAtReserve: input.tripMeterAtReserve,
      odometerAtReserve: input.odometerAtReserve,
      fuelLiter: input.fuelLiter,
      fuelPrice: input.fuelPrice,
    });

    return ok({
      message: 'Refuel record created successfully',
      data: RefuelRecordResponseDto.fromEntity(created),
    });
  }

  /** Older clients omit `entryType`; keep their behaviour by inferring it. */
  private resolveEntryType(input: CreateRefuelDto): RefuelEntryType {
    if (input.entryType) return input.entryType;
    return input.tripMeterAtReserve != null || input.odometerAtReserve != null
      ? 'RESERVE_COMPLETE'
      : 'TOPUP';
  }

  private validateReserveMarker(input: CreateRefuelDto): void {
    if (input.fuelLiter != null || input.fuelPrice != null) {
      throw new BadRequestException(
        'A RESERVE_INCOMPLETE entry cannot carry fuelLiter or fuelPrice',
      );
    }
    if (input.odometerReading != null || input.tripMeterReading != null) {
      throw new BadRequestException(
        'A RESERVE_INCOMPLETE entry only carries tripMeterAtReserve/odometerAtReserve',
      );
    }
    if (input.tripMeterAtReserve == null && input.odometerAtReserve == null) {
      throw new BadRequestException(
        'At least one of tripMeterAtReserve or odometerAtReserve is required',
      );
    }
  }
}
