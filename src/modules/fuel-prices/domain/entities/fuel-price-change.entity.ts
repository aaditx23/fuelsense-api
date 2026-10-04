import { FuelTypeName } from './fuel-price.entity';

/** A fuel's price moving from one value to another. */
export type FuelPriceChange = {
  fuelType: FuelTypeName;
  oldPrice: number;
  newPrice: number;
};

export type PriceDirection = 'rise' | 'drop';

export const directionOf = (change: FuelPriceChange): PriceDirection =>
  change.newPrice > change.oldPrice ? 'rise' : 'drop';
