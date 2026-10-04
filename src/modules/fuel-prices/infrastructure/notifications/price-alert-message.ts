import {
  directionOf,
  FuelPriceChange,
} from '../../domain/entities/fuel-price-change.entity';

export type PriceAlertMessage = {
  topic: string;
  notification: { title: string; body: string };
  data: Record<string, string>;
  android: { priority: 'high' };
};

const LABELS: Record<string, string> = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  OCTANE: 'Octane',
};

const format = (price: number): string => price.toFixed(2).replace(/\.00$/, '');

export function buildPriceAlert(
  change: FuelPriceChange,
  topic: string,
): PriceAlertMessage {
  const label = LABELS[change.fuelType] ?? change.fuelType;
  const verb = directionOf(change) === 'rise' ? 'up' : 'down';

  return {
    topic,
    notification: {
      title: `${label} price ${verb}`,
      body: `${label} is now ${format(change.newPrice)} TK/L (was ${format(change.oldPrice)}).`,
    },
    // The app opens the price screen for this fuel when the alert is tapped.
    data: {
      route: 'price_history',
      fuelType: change.fuelType,
      oldPrice: String(change.oldPrice),
      newPrice: String(change.newPrice),
    },
    android: { priority: 'high' },
  };
}
