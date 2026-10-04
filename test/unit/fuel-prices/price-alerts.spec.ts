import { directionOf } from '../../../src/modules/fuel-prices/domain/entities/fuel-price-change.entity';
import type {
  FuelPriceDetail,
  FuelPriceEntity,
} from '../../../src/modules/fuel-prices/domain/entities/fuel-price.entity';
import { detectPriceChanges } from '../../../src/modules/fuel-prices/domain/services/detect-price-changes';
import {
  anyChangeTopic,
  topicsFor,
} from '../../../src/modules/fuel-prices/domain/services/price-alert-topics';
import { FirebasePriceAlertNotifier } from '../../../src/modules/fuel-prices/infrastructure/notifications/firebase-price-alert-notifier';
import { buildPriceAlert } from '../../../src/modules/fuel-prices/infrastructure/notifications/price-alert-message';

const detail = (price: number | null): FuelPriceDetail => ({
  price,
  updatedAt: new Date(),
  effectiveFrom: new Date('2026-06-01'),
  createdAt: new Date(),
});

const prices = (
  diesel: number | null,
  petrol: number | null,
  octane: number | null,
): FuelPriceEntity => ({
  diesel: detail(diesel),
  petrol: detail(petrol),
  octane: detail(octane),
});

describe('detectPriceChanges', () => {
  it('reports nothing on the first ever snapshot', () => {
    expect(detectPriceChanges(null, prices(100, 110, 120))).toEqual([]);
  });

  it('reports nothing when no price moved', () => {
    expect(
      detectPriceChanges(prices(100, 110, 120), prices(100, 110, 120)),
    ).toEqual([]);
  });

  it('reports each fuel that moved, with old and new price', () => {
    expect(
      detectPriceChanges(prices(100, 110, 120), prices(100, 114, 118)),
    ).toEqual([
      { fuelType: 'PETROL', oldPrice: 110, newPrice: 114 },
      { fuelType: 'OCTANE', oldPrice: 120, newPrice: 118 },
    ]);
  });

  it('ignores floating point noise', () => {
    expect(
      detectPriceChanges(prices(100, 110, 120), prices(100, 110.0000001, 120)),
    ).toEqual([]);
  });

  it('skips a fuel missing a price on either side', () => {
    expect(
      detectPriceChanges(prices(null, 110, 120), prices(105, 110, null)),
    ).toEqual([]);
  });
});

describe('price alert topics', () => {
  it('a rise goes to the any-change and the rise topic', () => {
    const change = { fuelType: 'PETROL', oldPrice: 110, newPrice: 114 } as const;

    expect(directionOf(change)).toBe('rise');
    expect(topicsFor(change)).toEqual(['price-petrol', 'price-petrol-rise']);
  });

  it('a drop goes to the any-change and the drop topic', () => {
    expect(
      topicsFor({ fuelType: 'DIESEL', oldPrice: 100, newPrice: 95 }),
    ).toEqual(['price-diesel', 'price-diesel-drop']);
  });

  it('names the any-change topic by lower-case fuel', () => {
    expect(anyChangeTopic('OCTANE')).toBe('price-octane');
  });
});

describe('buildPriceAlert', () => {
  it('words a rise and carries the route for the app', () => {
    const message = buildPriceAlert(
      { fuelType: 'PETROL', oldPrice: 110, newPrice: 114.5 },
      'price-petrol',
    );

    expect(message.topic).toBe('price-petrol');
    expect(message.notification.title).toBe('Petrol price up');
    expect(message.notification.body).toBe(
      'Petrol is now 114.50 TK/L (was 110).',
    );
    expect(message.data).toMatchObject({
      route: 'price_history',
      fuelType: 'PETROL',
    });
  });

  it('words a drop', () => {
    const message = buildPriceAlert(
      { fuelType: 'DIESEL', oldPrice: 100, newPrice: 95 },
      'price-diesel',
    );

    expect(message.notification.title).toBe('Diesel price down');
  });
});

describe('FirebasePriceAlertNotifier without configuration', () => {
  const original = process.env.FIREBASE_SERVICE_ACCOUNT;

  beforeEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT = original;
    }
  });

  it('notify is a silent no-op', async () => {
    const notifier = new FirebasePriceAlertNotifier();

    await expect(
      notifier.notify([{ fuelType: 'PETROL', oldPrice: 1, newPrice: 2 }]),
    ).resolves.toBeUndefined();
  });

  it('sendTest reports that push is not configured', async () => {
    const notifier = new FirebasePriceAlertNotifier();

    await expect(notifier.sendTest()).resolves.toBe(false);
  });

  it('a malformed account does not throw out of notify', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = '{not json';
    const notifier = new FirebasePriceAlertNotifier();

    await expect(
      notifier.notify([{ fuelType: 'PETROL', oldPrice: 1, newPrice: 2 }]),
    ).resolves.toBeUndefined();
  });
});
