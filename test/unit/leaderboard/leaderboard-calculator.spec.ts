import {
  bikeStats,
  FuelActivity,
  MaintenanceActivity,
  ownerCost,
  ownerMileage,
  OwnerActivity,
  periodStart,
  trimmedMean,
} from '../../../src/modules/leaderboard/domain/services/leaderboard-calculator';

const NOW = new Date('2026-10-01T00:00:00Z');
const day = (offset: number): Date => new Date(NOW.getTime() + offset * 86400000);

const reserve = (
  at: Date,
  odometer: number,
  liters: number,
  amount: number | null = null,
): FuelActivity => ({
  userBikeId: 1,
  entryType: 'RESERVE_COMPLETE',
  odometerAtReserve: odometer,
  odometerReading: null,
  fuelLiter: liters,
  amount,
  createdAt: at,
});

const topup = (
  at: Date,
  liters: number,
  odometer: number | null = null,
  amount: number | null = null,
): FuelActivity => ({
  userBikeId: 1,
  entryType: 'TOPUP',
  odometerAtReserve: null,
  odometerReading: odometer,
  fuelLiter: liters,
  amount,
  createdAt: at,
});

const service = (
  at: Date,
  odometer: number,
  cost: number,
): MaintenanceActivity => ({ serviceDate: at, odometerReading: odometer, cost });

/** Two reserve hits `distance` km apart burning `liters` between them. */
const ride = (distance: number, liters: number, fuelAmount = 0): OwnerActivity => ({
  fuel: [
    reserve(day(-200), 1000, liters, fuelAmount || null),
    reserve(day(-100), 1000 + distance, 3),
  ],
  maintenance: [],
});

describe('ownerMileage', () => {
  it('is distance over the fuel burned between reserve hits', () => {
    expect(ownerMileage(ride(400, 8), 40, null)).toBe(50);
  });

  it('needs at least 300 km of measured riding', () => {
    expect(ownerMileage(ride(299, 6), 40, null)).toBeNull();
    expect(ownerMileage(ride(300, 6), 40, null)).toBe(50);
  });

  it('needs two completed reserve entries', () => {
    const activity: OwnerActivity = {
      fuel: [reserve(day(-10), 1000, 5)],
      maintenance: [],
    };

    expect(ownerMileage(activity, 40, null)).toBeNull();
  });

  it('drops a figure far below or above the claimed mileage', () => {
    expect(ownerMileage(ride(400, 100), 40, null)).toBeNull(); // 4 km/L < 0.3x
    expect(ownerMileage(ride(400, 2), 40, null)).toBeNull(); // 200 km/L > 3x
  });

  it('keeps a figure at the edge of the band', () => {
    expect(ownerMileage(ride(400, 400 / 12), 40, null)).toBeCloseTo(12, 5);
    expect(ownerMileage(ride(400, 400 / 120), 40, null)).toBeCloseTo(120, 5);
  });

  it('does not apply the band when the claimed mileage is unknown', () => {
    expect(ownerMileage(ride(400, 2), 0, null)).toBe(200);
  });

  it('counts top-ups between the two reserve hits', () => {
    const activity: OwnerActivity = {
      fuel: [
        reserve(day(-200), 1000, 4),
        topup(day(-150), 4),
        reserve(day(-100), 1400, 3),
      ],
      maintenance: [],
    };

    expect(ownerMileage(activity, 40, null)).toBe(50);
  });

  it('only looks at the period asked for', () => {
    const activity: OwnerActivity = {
      fuel: [
        reserve(day(-400), 1000, 5),
        reserve(day(-300), 1500, 5), // old cycle
        reserve(day(-60), 2000, 5),
        reserve(day(-30), 2400, 5),
      ],
      maintenance: [],
    };

    expect(ownerMileage(activity, 40, periodStart('LAST_6M', NOW))).toBe(80);
    expect(ownerMileage(activity, 40, null)).toBeCloseTo(1400 / 15, 5);
  });
});

describe('ownerCost', () => {
  it('needs odometer readings spanning at least 300 km', () => {
    const activity: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000, 600), topup(day(-10), 5, 1299, 600)],
      maintenance: [],
    };

    expect(ownerCost(activity, null)).toBeNull();
  });

  it('is fuel plus maintenance over the odometer span', () => {
    const activity: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000, 600), topup(day(-10), 5, 1500, 400)],
      maintenance: [service(day(-15), 1200, 500)],
    };

    expect(ownerCost(activity, null)).toEqual({
      runningCostPerKm: 3, // (1000 fuel + 500 maintenance) / 500 km
      maintenanceCostPer1000Km: 1000,
    });
  });

  it('has no running cost without a fuel amount, and no maintenance cost without a log', () => {
    const noAmount: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000), topup(day(-10), 5, 1500)],
      maintenance: [service(day(-15), 1200, 500)],
    };
    const noService: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000, 600), topup(day(-10), 5, 1500, 400)],
      maintenance: [],
    };

    expect(ownerCost(noAmount, null)).toEqual({
      runningCostPerKm: null,
      maintenanceCostPer1000Km: 1000,
    });
    expect(ownerCost(noService, null)).toEqual({
      runningCostPerKm: 2,
      maintenanceCostPer1000Km: null,
    });
  });

  it('uses maintenance odometer readings toward the span', () => {
    const activity: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000, 500)],
      maintenance: [service(day(-10), 1400, 0)],
    };

    expect(ownerCost(activity, null)?.runningCostPerKm).toBe(500 / 400);
  });

  it('only counts activity inside the period', () => {
    const activity: OwnerActivity = {
      fuel: [
        topup(day(-400), 5, 100, 9999),
        topup(day(-20), 5, 5000, 500),
        topup(day(-10), 5, 5400, 500),
      ],
      maintenance: [],
    };

    expect(ownerCost(activity, periodStart('LAST_6M', NOW))?.runningCostPerKm).toBe(
      1000 / 400,
    );
  });
});

describe('trimmedMean', () => {
  it('is a plain mean below ten owners', () => {
    expect(trimmedMean([10, 20, 30, 1000])).toBe(265);
  });

  it('drops the top and bottom tenth from ten owners up', () => {
    const values = [1, 40, 41, 42, 43, 44, 45, 46, 47, 500];

    expect(trimmedMean(values)).toBe(43.5); // mean of 40..47
  });

  it('does not depend on input order', () => {
    expect(trimmedMean([3, 1, 2])).toBe(trimmedMean([1, 2, 3]));
  });
});

describe('bikeStats', () => {
  const owners = (count: number, mileage = 40): OwnerActivity[] =>
    Array.from({ length: count }, () => ride(400, 400 / mileage));

  it('averages owner mileage and compares it to the claim', () => {
    const stats = bikeStats(owners(3, 45), 50, 'ALL', NOW);

    expect(stats.ownerCount).toBe(3);
    expect(stats.avgMileage).toBe(45);
    expect(stats.claimRatio).toBe(0.9);
  });

  it('has no figures when no owner qualifies', () => {
    const stats = bikeStats([{ fuel: [], maintenance: [] }], 50, 'ALL', NOW);

    expect(stats).toEqual({
      ownerCount: 0,
      runningOwnerCount: 0,
      maintenanceOwnerCount: 0,
      avgMileage: null,
      claimRatio: null,
      runningCostPerKm: null,
      maintenanceCostPer1000Km: null,
    });
  });

  it('has no claim ratio when the claimed mileage is unknown', () => {
    const stats = bikeStats(owners(2, 45), 0, 'ALL', NOW);

    expect(stats.avgMileage).toBe(45);
    expect(stats.claimRatio).toBeNull();
  });

  it('counts each cost metric with its own owners', () => {
    const withRunning: OwnerActivity = {
      fuel: [topup(day(-20), 5, 1000, 600), topup(day(-10), 5, 1500, 400)],
      maintenance: [],
    };
    const withBoth: OwnerActivity = {
      ...withRunning,
      maintenance: [service(day(-15), 1200, 500)],
    };

    const stats = bikeStats([withRunning, withBoth], 40, 'ALL', NOW);

    expect(stats.runningOwnerCount).toBe(2);
    expect(stats.maintenanceOwnerCount).toBe(1);
    expect(stats.maintenanceCostPer1000Km).toBe(1000);
  });

  it('trims a single wild owner out of a large group', () => {
    const group = [...owners(9, 40), ride(400, 400 / 110)];

    const stats = bikeStats(group, 40, 'ALL', NOW);

    expect(stats.ownerCount).toBe(10);
    expect(stats.avgMileage).toBe(40);
  });
});

describe('periodStart', () => {
  it('is null for all time and six months back otherwise', () => {
    expect(periodStart('ALL', NOW)).toBeNull();
    expect(periodStart('LAST_6M', NOW)?.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });
});
