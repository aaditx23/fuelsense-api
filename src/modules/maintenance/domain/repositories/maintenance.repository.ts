import { MaintenanceRecordEntity } from '../entities/maintenance-record.entity';

export const MAINTENANCE_REPOSITORY = 'MAINTENANCE_REPOSITORY';

export type CreateMaintenanceInput = {
  userId: number;
  userBikeId: number;
  odometerReading: number;
  category: string;
  description?: string | null;
  partsCost?: number;
  laborCost?: number;
  partsBrand?: string | null;
  serviceDate?: Date;
};

/** Only the provided fields change; `null` clears the optional ones. */
export type UpdateMaintenanceInput = {
  odometerReading?: number;
  category?: string;
  description?: string | null;
  partsCost?: number;
  laborCost?: number;
  partsBrand?: string | null;
  serviceDate?: Date;
};

export interface MaintenanceRepository {
  isUserBikeOwnedByUser(userId: number, userBikeId: number): Promise<boolean>;
  createMaintenanceRecord(input: CreateMaintenanceInput): Promise<MaintenanceRecordEntity>;
  findOwnedRecord(userId: number, id: number): Promise<MaintenanceRecordEntity | null>;
  updateMaintenanceRecord(id: number, input: UpdateMaintenanceInput): Promise<MaintenanceRecordEntity>;
  deleteMaintenanceRecord(id: number): Promise<void>;
  getUserMaintenanceLogs(userId: number): Promise<MaintenanceRecordEntity[]>;
  getBikeModelMaintenanceLogs(bikeId: number): Promise<MaintenanceRecordEntity[]>;
  getBikeModelUserBikes(bikeId: number): Promise<{ id: number; userId: number; createdAt: Date }[]>;
  getBikeModelFuelRecords(
    bikeId: number,
  ): Promise<
    {
      id: number;
      userBikeId: number;
      tripMeterReading: number | null;
      fuelLiter: number | null;
    }[]
  >;
  getRegisteredParts(): Promise<string[]>;
}
