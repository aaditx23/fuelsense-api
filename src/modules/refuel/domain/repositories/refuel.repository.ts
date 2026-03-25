import { RefuelRecordEntity } from '../entities/refuel-record.entity';

export const REFUEL_REPOSITORY = 'REFUEL_REPOSITORY';

export type CreateRefuelInput = {
  userId: number;
  userBikeId: number;
  odometerReading?: number | null;
  tripMeterReading?: number | null;
  tripMeterAtReserve?: number | null;
  odometerAtReserve?: number | null;
  fuelLiter?: number | null;
  fuelPrice?: number | null;
};

export interface RefuelRepository {
  isUserBikeOwnedByUser(userId: number, userBikeId: number): Promise<boolean>;
  countByUserBike(userBikeId: number): Promise<number>;
  createRefuelRecord(input: CreateRefuelInput): Promise<RefuelRecordEntity>;
  getUserRefuelRecords(userId: number): Promise<RefuelRecordEntity[]>;
}
