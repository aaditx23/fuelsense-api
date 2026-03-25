import { BikeEntity } from '../entities/bike.entity';

export type SubmitBikeInput = {
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: 'PETROL' | 'DIESEL' | 'OCTANE';
  expectedMileage: number;
  tankCapacity: number;
  reserveCapacity?: number | null;
  image?: string | null;
  submittedById?: number | null;
};

export const BIKE_REPOSITORY = 'BIKE_REPOSITORY';

export interface BikeRepository {
  findActive(): Promise<BikeEntity[]>;
  findMyActiveBikes(userId: number): Promise<BikeEntity[]>;
  findByVariant(input: Pick<SubmitBikeInput, 'brand' | 'model' | 'engineCc' | 'modelYear'>): Promise<BikeEntity | null>;
  findById(bikeId: number): Promise<BikeEntity | null>;
  createPending(input: SubmitBikeInput): Promise<BikeEntity>;
  hasUserBikeSelection(userId: number, bikeId: number): Promise<boolean>;
  selectBike(userId: number, bikeId: number): Promise<void>;
  removeBikeSelection(userId: number, bikeId: number): Promise<boolean>;
}
