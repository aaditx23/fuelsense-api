import {
  FuelPriceEntity,
  FuelPriceHistoryPoint,
  FuelPriceSummary,
  FuelTypeName,
} from '../entities/fuel-price.entity';

export const FUEL_PRICE_REPOSITORY = 'FUEL_PRICE_REPOSITORY';

export interface FuelPriceRepository {
  findLatest(): Promise<FuelPriceEntity | null>;
  findAll(): Promise<FuelPriceEntity[]>;
  getSummary(): Promise<FuelPriceSummary>;
  /** Prices of one fuel type effective on or after the given date, oldest first. */
  findHistory(fuelType: FuelTypeName, since: Date): Promise<FuelPriceHistoryPoint[]>;
  saveIfChanged(input: {
    diesel: { price: number | null; effectiveDate: Date | null };
    petrol: { price: number | null; effectiveDate: Date | null };
    octane: { price: number | null; effectiveDate: Date | null };
  }): Promise<{
    record: FuelPriceEntity;
    inserted: boolean;
  }>;
}
