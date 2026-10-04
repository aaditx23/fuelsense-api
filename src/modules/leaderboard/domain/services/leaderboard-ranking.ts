import type {
  LeaderboardBikeSummary,
  LeaderboardStatWithBike,
} from '../repositories/leaderboard.repository';
import { MIN_RANKED_OWNERS } from './leaderboard-calculator';

export type LeaderboardMetric =
  | 'mileage'
  | 'claim'
  | 'running-cost'
  | 'maintenance-cost';

export const LEADERBOARD_METRICS: readonly LeaderboardMetric[] = [
  'mileage',
  'claim',
  'running-cost',
  'maintenance-cost',
];

export type EngineClass = 'UP_TO_110' | 'CC_111_150' | 'CC_151_200' | 'OVER_200';

export const ENGINE_CLASSES: readonly EngineClass[] = [
  'UP_TO_110',
  'CC_111_150',
  'CC_151_200',
  'OVER_200',
];

export type LeaderboardFilter = {
  engineClass?: EngineClass;
  fuelType?: string;
  brand?: string;
  year?: number;
};

export type LeaderboardEntry = {
  /** Place among ranked models, or null while the model has too few owners. */
  rank: number | null;
  bike: Omit<LeaderboardBikeSummary, 'expectedMileage'> & {
    expectedMileage: number;
  };
  value: number;
  ownerCount: number;
  ranked: boolean;
};

export const engineClassOf = (cc: number): EngineClass => {
  if (cc <= 110) return 'UP_TO_110';
  if (cc <= 150) return 'CC_111_150';
  if (cc <= 200) return 'CC_151_200';

  return 'OVER_200';
};

/** Higher is better for mileage and claim ratio; lower for the two costs. */
export const higherIsBetter = (metric: LeaderboardMetric): boolean =>
  metric === 'mileage' || metric === 'claim';

/** A row's figure for [metric] and how many owners stand behind it. */
export function metricOf(
  row: LeaderboardStatWithBike,
  metric: LeaderboardMetric,
): { value: number | null; ownerCount: number } {
  switch (metric) {
    case 'mileage':
      return { value: row.avgMileage, ownerCount: row.ownerCount };
    case 'claim':
      return { value: row.claimRatio, ownerCount: row.ownerCount };
    case 'running-cost':
      return { value: row.runningCostPerKm, ownerCount: row.runningOwnerCount };
    case 'maintenance-cost':
      return {
        value: row.maintenanceCostPer1000Km,
        ownerCount: row.maintenanceOwnerCount,
      };
  }
}

export function matchesFilter(
  bike: LeaderboardBikeSummary,
  filter: LeaderboardFilter,
): boolean {
  return (
    (!filter.engineClass || engineClassOf(bike.engineCc) === filter.engineClass) &&
    (!filter.fuelType || bike.fuelType === filter.fuelType) &&
    (!filter.brand || bike.brand.toLowerCase() === filter.brand.toLowerCase()) &&
    (filter.year === undefined || bike.modelYear === filter.year)
  );
}

/**
 * Ranks bike models on [metric]. Models with enough owners come first, best to
 * worst, equal values sharing a place; models still collecting data follow,
 * unranked, most owners first.
 */
export function rankBikes(
  rows: LeaderboardStatWithBike[],
  metric: LeaderboardMetric,
  filter: LeaderboardFilter = {},
): LeaderboardEntry[] {
  const candidates = rows
    .filter((row) => matchesFilter(row.bike, filter))
    .flatMap((row) => {
      const { value, ownerCount } = metricOf(row, metric);

      return value === null ? [] : [{ row, value, ownerCount }];
    });

  const ranked = candidates
    .filter((c) => c.ownerCount >= MIN_RANKED_OWNERS)
    .sort((a, b) => {
      const byValue = higherIsBetter(metric) ? b.value - a.value : a.value - b.value;

      return byValue !== 0 ? byValue : b.ownerCount - a.ownerCount;
    });
  const collecting = candidates
    .filter((c) => c.ownerCount < MIN_RANKED_OWNERS)
    .sort((a, b) => b.ownerCount - a.ownerCount);

  let place = 0;
  const entries: LeaderboardEntry[] = ranked.map((c, index) => {
    if (index === 0 || c.value !== ranked[index - 1].value) {
      place = index + 1;
    }

    return {
      rank: place,
      bike: c.row.bike,
      value: c.value,
      ownerCount: c.ownerCount,
      ranked: true,
    };
  });

  for (const c of collecting) {
    entries.push({
      rank: null,
      bike: c.row.bike,
      value: c.value,
      ownerCount: c.ownerCount,
      ranked: false,
    });
  }

  return entries;
}
