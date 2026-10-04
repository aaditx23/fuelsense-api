import { FuelPriceChange } from '../entities/fuel-price-change.entity';

export const PRICE_ALERT_NOTIFIER = 'PRICE_ALERT_NOTIFIER';

export interface PriceAlertNotifier {
  /** Tells subscribed devices about price changes. Never throws: a failed
   *  notification must not fail the price update that caused it. */
  notify(changes: FuelPriceChange[]): Promise<void>;

  /** Sends a clearly marked test message. Resolves to whether push is
   *  configured at all. */
  sendTest(): Promise<boolean>;
}
