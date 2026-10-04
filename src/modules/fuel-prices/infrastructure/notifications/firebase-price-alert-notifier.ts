import { Injectable, Logger } from '@nestjs/common';
import { FuelPriceChange } from '../../domain/entities/fuel-price-change.entity';
import { PriceAlertNotifier } from '../../domain/services/price-alert-notifier';
import { TEST_TOPIC, topicsFor } from '../../domain/services/price-alert-topics';
import { buildPriceAlert, PriceAlertMessage } from './price-alert-message';

type Messaging = { send(message: PriceAlertMessage): Promise<string> };

/**
 * Publishes price alerts to Firebase Cloud Messaging topics. Push is optional:
 * without FIREBASE_SERVICE_ACCOUNT in the environment every call is a no-op,
 * so the price update itself never depends on Firebase being set up.
 */
@Injectable()
export class FirebasePriceAlertNotifier implements PriceAlertNotifier {
  private readonly logger = new Logger(FirebasePriceAlertNotifier.name);
  private messagingPromise: Promise<Messaging | null> | null = null;

  async notify(changes: FuelPriceChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    try {
      const messaging = await this.messaging();
      if (!messaging) {
        return;
      }
      for (const change of changes) {
        for (const topic of topicsFor(change)) {
          await messaging.send(buildPriceAlert(change, topic));
        }
      }
    } catch (error) {
      this.logger.error(`Price alert failed: ${(error as Error).message}`);
    }
  }

  async sendTest(): Promise<boolean> {
    try {
      const messaging = await this.messaging();
      if (!messaging) {
        return false;
      }
      await messaging.send(
        buildPriceAlert(
          { fuelType: 'PETROL', oldPrice: 0, newPrice: 0 },
          TEST_TOPIC,
        ),
      );

      return true;
    } catch (error) {
      this.logger.error(`Test price alert failed: ${(error as Error).message}`);

      return false;
    }
  }

  private messaging(): Promise<Messaging | null> {
    this.messagingPromise ??= this.createMessaging();

    return this.messagingPromise;
  }

  private async createMessaging(): Promise<Messaging | null> {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT is not set; price alerts are disabled.',
      );

      return null;
    }

    const account = JSON.parse(
      raw.trim().startsWith('{')
        ? raw
        : Buffer.from(raw, 'base64').toString('utf8'),
    );

    // Loaded on first use so the SDK costs nothing when push is not configured.
    const { cert, getApps, initializeApp, getApp } = await import(
      'firebase-admin/app'
    );
    const { getMessaging } = await import('firebase-admin/messaging');
    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({ credential: cert(account) });

    return getMessaging(app) as unknown as Messaging;
  }
}
