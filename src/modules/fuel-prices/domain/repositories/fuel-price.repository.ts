import {
  FuelPriceEntity,
  FuelPriceSummary,
} from '../entities/fuel-price.entity';

export const FUEL_PRICE_REPOSITORY = 'FUEL_PRICE_REPOSITORY';

export interface FuelPriceRepository {
  findLatest(): Promise<FuelPriceEntity | null>;
  findAll(): Promise<FuelPriceEntity[]>;
  getSummary(): Promise<FuelPriceSummary>;
  saveIfChanged(input: {
    diesel: { price: number | null; effectiveDate: Date | null };
    petrol: { price: number | null; effectiveDate: Date | null };
    octane: { price: number | null; effectiveDate: Date | null };
  }): Promise<{
    record: FuelPriceEntity;
    inserted: boolean;
  }>;
}
