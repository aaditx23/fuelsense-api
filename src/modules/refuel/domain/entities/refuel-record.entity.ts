export const REFUEL_ENTRY_TYPES = [
  'RESERVE_INCOMPLETE',
  'RESERVE_COMPLETE',
  'TOPUP',
] as const;

export type RefuelEntryType = (typeof REFUEL_ENTRY_TYPES)[number];

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
  entryType: RefuelEntryType;
  createdAt: Date;
};
