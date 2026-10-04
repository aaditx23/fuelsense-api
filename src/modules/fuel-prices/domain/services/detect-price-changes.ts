import { FuelPriceChange } from '../entities/fuel-price-change.entity';
import { FuelPriceEntity, FuelTypeName } from '../entities/fuel-price.entity';

/** Prices closer than this are the same price (floating point noise). */
const EPSILON = 0.001;

const FUELS: ReadonlyArray<[FuelTypeName, keyof FuelPriceEntity]> = [
  ['PETROL', 'petrol'],
  ['DIESEL', 'diesel'],
  ['OCTANE', 'octane'],
];

/**
 * The fuels whose price differs between two snapshots. A fuel with no price on
 * either side is skipped: that is missing data, not a change.
 */
export function detectPriceChanges(
  previous: FuelPriceEntity | null,
  current: FuelPriceEntity,
): FuelPriceChange[] {
  if (!previous) {
    return [];
  }

  const changes: FuelPriceChange[] = [];
  for (const [fuelType, key] of FUELS) {
    const oldPrice = previous[key].price;
    const newPrice = current[key].price;
    if (oldPrice == null || newPrice == null) {
      continue;
    }
    if (Math.abs(newPrice - oldPrice) > EPSILON) {
      changes.push({ fuelType, oldPrice, newPrice });
    }
  }

  return changes;
}
