import {
  MileageRecord,
  reserveCycleTotals,
} from '../../../../common/fuel/mileage-calculator';

/** An owner needs at least this much measured riding to count. */
export const MIN_OWNER_DISTANCE_KM = 300;

/** A bike model is ranked once this many distinct owners back a metric. */
export const MIN_RANKED_OWNERS = 5;

/** From this many owners up, the top and bottom tenth are dropped. */
export const TRIM_FROM_OWNERS = 10;

/** An owner's mileage outside this band of the claimed figure is a typo. */
export const MIN_CLAIM_RATIO = 0.3;
export const MAX_CLAIM_RATIO = 3;

export type LeaderboardPeriod = 'ALL' | 'LAST_6M';

export type FuelActivity = MileageRecord & {
  odometerReading: number | null;
  /** Total amount paid for this refuel, or null when none was logged. */
  amount: number | null;
};

export type MaintenanceActivity = {
  serviceDate: Date;
  odometerReading: number;
  cost: number;
};

/** Everything one owner logged for one bike model. */
export type OwnerActivity = {
  fuel: FuelActivity[];
  maintenance: MaintenanceActivity[];
};

export type BikeStats = {
  /** Owners behind the mileage and claim figures. */
  ownerCount: number;
  /** Owners behind the running cost figure. */
  runningOwnerCount: number;
  /** Owners behind the maintenance cost figure. */
  maintenanceOwnerCount: number;
  avgMileage: number | null;
  claimRatio: number | null;
  runningCostPerKm: number | null;
  maintenanceCostPer1000Km: number | null;
};

/** Start of the period, or null for all time. */
export function periodStart(period: LeaderboardPeriod, now: Date): Date | null {
  if (period === 'ALL') {
    return null;
  }
  const start = new Date(now);
  start.setUTCMonth(start.getUTCMonth() - 6);

  return start;
}

const within = (at: Date, start: Date | null): boolean =>
  start === null || at >= start;

/**
 * An owner's km/L over the period, or null when the owner does not count: too
 * little measured riding, or a figure so far from the claimed mileage that it
 * is almost certainly a data-entry slip.
 */
export function ownerMileage(
  activity: OwnerActivity,
  expectedMileage: number,
  start: Date | null,
): number | null {
  const records = activity.fuel.filter((r) => within(r.createdAt, start));
  const totals = [...reserveCycleTotals(records).values()][0];
  if (!totals || totals.fuel <= 0 || totals.distance < MIN_OWNER_DISTANCE_KM) {
    return null;
  }

  const mileage = totals.distance / totals.fuel;
  if (expectedMileage > 0) {
    const ratio = mileage / expectedMileage;
    if (ratio < MIN_CLAIM_RATIO || ratio > MAX_CLAIM_RATIO) {
      return null;
    }
  }

  return mileage;
}

export type OwnerCost = {
  /** Fuel plus maintenance spend per km; null with no fuel amount logged. */
  runningCostPerKm: number | null;
  /** Maintenance spend per 1,000 km; null with no maintenance logged. */
  maintenanceCostPer1000Km: number | null;
};

/**
 * An owner's spend per distance over the period. Distance is the odometer span
 * across everything logged, and must reach [MIN_OWNER_DISTANCE_KM].
 */
export function ownerCost(
  activity: OwnerActivity,
  start: Date | null,
): OwnerCost | null {
  const fuel = activity.fuel.filter((r) => within(r.createdAt, start));
  const maintenance = activity.maintenance.filter((m) =>
    within(m.serviceDate, start),
  );

  const odometers = [
    ...fuel.flatMap((r) => [r.odometerReading, r.odometerAtReserve]),
    ...maintenance.map((m) => m.odometerReading),
  ].filter((value): value is number => value !== null && value >= 0);
  if (odometers.length < 2) {
    return null;
  }
  const span = Math.max(...odometers) - Math.min(...odometers);
  if (span < MIN_OWNER_DISTANCE_KM) {
    return null;
  }

  const fuelSpend = fuel.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const maintenanceSpend = maintenance.reduce((sum, m) => sum + m.cost, 0);

  return {
    runningCostPerKm:
      fuelSpend > 0 ? (fuelSpend + maintenanceSpend) / span : null,
    maintenanceCostPer1000Km:
      maintenanceSpend > 0 ? (maintenanceSpend / span) * 1000 : null,
  };
}

/** Mean, with the top and bottom tenth dropped once there are enough owners. */
export function trimmedMean(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const drop =
    sorted.length >= TRIM_FROM_OWNERS ? Math.floor(sorted.length * 0.1) : 0;
  const kept = sorted.slice(drop, sorted.length - drop);

  return kept.reduce((sum, v) => sum + v, 0) / kept.length;
}

const round = (value: number, places: number): number => {
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
};

const mean = (values: number[]): number | null =>
  values.length > 0 ? round(trimmedMean(values), 2) : null;

/** One bike model's ranking figures from all of its owners' activity. */
export function bikeStats(
  owners: OwnerActivity[],
  expectedMileage: number,
  period: LeaderboardPeriod,
  now: Date,
): BikeStats {
  const start = periodStart(period, now);

  const mileages = owners
    .map((owner) => ownerMileage(owner, expectedMileage, start))
    .filter((value): value is number => value !== null);

  const costs = owners
    .map((owner) => ownerCost(owner, start))
    .filter((value): value is OwnerCost => value !== null);
  const running = costs
    .map((c) => c.runningCostPerKm)
    .filter((value): value is number => value !== null);
  const maintenance = costs
    .map((c) => c.maintenanceCostPer1000Km)
    .filter((value): value is number => value !== null);

  const avgMileage = mean(mileages);

  return {
    ownerCount: mileages.length,
    runningOwnerCount: running.length,
    maintenanceOwnerCount: maintenance.length,
    avgMileage,
    claimRatio:
      avgMileage !== null && expectedMileage > 0
        ? round(avgMileage / expectedMileage, 3)
        : null,
    runningCostPerKm: mean(running),
    maintenanceCostPer1000Km: mean(maintenance),
  };
}
