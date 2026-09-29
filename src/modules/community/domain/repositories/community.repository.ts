import type { MileageSample } from '../../../../common/fuel/mileage-calculator';
import type { CommunityBikeEntity } from '../entities/community-bike.entity';
import type { BikeCommunityProfileEntity } from '../entities/bike-community-profile.entity';

export const COMMUNITY_REPOSITORY = 'COMMUNITY_REPOSITORY';

export type CommunityBikesQuery = {
  search: string;
  page: number;
  limit: number;
};

export type MaintenanceRecordRow = {
  userBikeId: number;
  category: string;
  odometerReading: number;
  partsCost: number;
  laborCost: number;
  partsBrand: string | null;
};

export interface CommunityRepository {
  getActiveBikesWithStats(query: CommunityBikesQuery): Promise<CommunityBikeEntity[]>;
  getBikeById(bikeId: number): Promise<{ id: number; brand: string; model: string; engineCc: number; modelYear: number; fuelType: string; image: string | null } | null>;
  getBikeMileageSamples(bikeId: number): Promise<MileageSample[]>;
  /** User bikes of this model that logged at least one refuel. */
  getBikeFuelContributorIds(bikeId: number): Promise<number[]>;
  getBikeMaintenanceRecords(bikeId: number): Promise<MaintenanceRecordRow[]>;
}
