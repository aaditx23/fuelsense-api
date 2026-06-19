export type MaintenanceRecordEntity = {
  id: number;
  userId: number;
  userBikeId: number;
  odometerReading: number;
  category: string;
  description: string | null;
  partsCost: number;
  laborCost: number;
  partsBrand: string | null;
  serviceDate: Date;
  createdAt: Date;
  updatedAt: Date;
};
