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

export interface MaintenanceRepository {
  isUserBikeOwnedByUser(userId: number, userBikeId: number): Promise<boolean>;
  createMaintenanceRecord(input: CreateMaintenanceInput): Promise<MaintenanceRecordEntity>;
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
