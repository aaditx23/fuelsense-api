import type {
  BikeStats,
  LeaderboardPeriod,
  OwnerActivity,
} from '../services/leaderboard-calculator';

export const LEADERBOARD_REPOSITORY = 'LEADERBOARD_REPOSITORY';

export type LeaderboardBikeSummary = {
  id: number;
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: string;
  image: string | null;
  expectedMileage: number;
};

export type LeaderboardStatRow = BikeStats & {
  bikeId: number;
  period: LeaderboardPeriod;
  updatedAt: Date;
};

export type LeaderboardStatWithBike = LeaderboardStatRow & {
  bike: LeaderboardBikeSummary;
};

export interface LeaderboardRepository {
  /** Approved bike models that can have owners. */
  getBikeCatalog(): Promise<LeaderboardBikeSummary[]>;

  /** What each owner of [bikeId] has logged. */
  loadBikeActivity(bikeId: number): Promise<OwnerActivity[]>;

  /** Replaces every stored row with [rows], atomically. */
  replaceStats(rows: LeaderboardStatRow[]): Promise<void>;

  countStats(): Promise<number>;

  findStats(period: LeaderboardPeriod): Promise<LeaderboardStatWithBike[]>;
}
