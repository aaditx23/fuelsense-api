export type RefuelRecordEntity = {
  id: number;
  userId: number;
  userBikeId: number;
  odometerReading: number | null;
  tripMeterReading: number | null;
  tripMeterAtReserve: number | null;
  odometerAtReserve: number | null;
  fuelLiter: number | null;
  fuelPrice: number | null;
  createdAt: Date;
};
