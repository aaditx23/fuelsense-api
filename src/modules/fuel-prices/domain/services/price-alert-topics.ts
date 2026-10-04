import {
  directionOf,
  FuelPriceChange,
} from '../entities/fuel-price-change.entity';

/** Topic a device subscribes to for every change of a fuel. */
export const anyChangeTopic = (fuelType: string): string =>
  `price-${fuelType.toLowerCase()}`;

/** Topics a change is published to: everyone for that fuel, and only those
 *  who asked for rises (or drops). A device subscribes to one of them, never
 *  both, so nobody is notified twice. */
export const topicsFor = (change: FuelPriceChange): string[] => [
  anyChangeTopic(change.fuelType),
  `${anyChangeTopic(change.fuelType)}-${directionOf(change)}`,
];

/** Topic the admin test message goes to; no device subscribes to it by default. */
export const TEST_TOPIC = 'price-test';
