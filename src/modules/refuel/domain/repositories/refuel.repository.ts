import {
  RefuelEntryType,
  RefuelRecordEntity,
} from '../entities/refuel-record.entity';

export const REFUEL_REPOSITORY = 'REFUEL_REPOSITORY';

export type CreateRefuelInput = {
  userId: number;
  userBikeId: number;
  entryType: RefuelEntryType;
  odometerReading?: number | null;
  tripMeterReading?: number | null;
  tripMeterAtReserve?: number | null;
  odometerAtReserve?: number | null;
  fuelLiter?: number | null;
  fuelPrice?: number | null;
};

export type CompleteRefuelInput = {
  odometerReading?: number | null;
  tripMeterReading?: number | null;
  fuelLiter?: number | null;
  fuelPrice?: number | null;
};

export interface RefuelRepository {
  isUserBikeOwnedByUser(userId: number, userBikeId: number): Promise<boolean>;
  countByUserBike(userId: number, userBikeId: number): Promise<number>;
  hasIncompleteReserve(userId: number, userBikeId: number): Promise<boolean>;
  findOwnedRecord(userId: number, id: number): Promise<RefuelRecordEntity | null>;
  createRefuelRecord(input: CreateRefuelInput): Promise<RefuelRecordEntity>;
  completeReserveRecord(
    id: number,
    input: CompleteRefuelInput,
  ): Promise<RefuelRecordEntity>;
  deleteRefuelRecord(id: number): Promise<void>;
  getUserRefuelRecords(userId: number): Promise<RefuelRecordEntity[]>;
}
