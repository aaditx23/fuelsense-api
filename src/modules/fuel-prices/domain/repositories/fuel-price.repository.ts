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
    date: Date;
    diesel: number | null;
    petrol: number | null;
    octane: number | null;
  }): Promise<{
    record: FuelPriceEntity;
    inserted: boolean;
  }>;
}
