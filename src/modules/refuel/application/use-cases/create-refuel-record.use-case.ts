import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
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
    if ((input.fuelLiter == null && input.fuelPrice == null) ||
        (input.fuelLiter != null && input.fuelPrice != null)) {
      throw new BadRequestException('Exactly one of fuelLiter or fuelPrice is required');
    }

    const isOwned = await this.refuelRepository.isUserBikeOwnedByUser(userId, input.userBikeId);
    if (!isOwned) {
      throw new ForbiddenException('You do not own this user bike');
    }

    const refuelCount = await this.refuelRepository.countByUserBike(input.userBikeId);
    const isFirstRefuel = refuelCount === 0;

    if (isFirstRefuel && input.odometerReading == null) {
      throw new BadRequestException('odometerReading is required for first refuel');
    }

    if (!isFirstRefuel && input.odometerReading == null && input.tripMeterReading == null) {
      throw new BadRequestException(
        'At least one of odometerReading or tripMeterReading is required',
      );
    }

    const created = await this.refuelRepository.createRefuelRecord({
      userId,
      userBikeId: input.userBikeId,
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
}
