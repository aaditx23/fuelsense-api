export type FuelPriceEntity = {
  id: number;
  date: Date;
  diesel: number | null;
  petrol: number | null;
  octane: number | null;
  createdAt: Date;
};

export type FuelPriceSummary = {
  dieselAvg: number | null;
  petrolAvg: number | null;
  octaneAvg: number | null;
};
