export type FuelPriceDetail = {
  price: number | null;
  updatedAt: Date;
  effectiveFrom: Date | null;
  createdAt: Date;
};

export type FuelPriceEntity = {
  diesel: FuelPriceDetail;
  petrol: FuelPriceDetail;
  octane: FuelPriceDetail;
};

export type FuelPriceSummary = {
  dieselAvg: number | null;
  petrolAvg: number | null;
  octaneAvg: number | null;
};
