import { RefuelRecordEntity } from '../../domain/entities/refuel-record.entity';

export class RefuelRecordResponseDto {
  id!: number;
  userId!: number;
  userBikeId!: number;
  odometerReading!: number | null;
  tripMeterReading!: number | null;
  tripMeterAtReserve!: number | null;
  odometerAtReserve!: number | null;
  fuelLiter!: number | null;
  fuelPrice!: number | null;
  createdAt!: Date;

  static fromEntity(entity: RefuelRecordEntity): RefuelRecordResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      userBikeId: entity.userBikeId,
      odometerReading: entity.odometerReading,
      tripMeterReading: entity.tripMeterReading,
      tripMeterAtReserve: entity.tripMeterAtReserve,
      odometerAtReserve: entity.odometerAtReserve,
      fuelLiter: entity.fuelLiter,
      fuelPrice: entity.fuelPrice,
      createdAt: entity.createdAt,
    };
  }
}
