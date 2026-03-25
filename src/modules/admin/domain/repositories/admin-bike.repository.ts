import { BikeEntity } from '../../../bikes/domain/entities/bike.entity';

export const ADMIN_BIKE_REPOSITORY = 'ADMIN_BIKE_REPOSITORY';

export type EditBikeInput = Partial<{
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: 'PETROL' | 'DIESEL' | 'OCTANE';
  expectedMileage: number;
  tankCapacity: number;
  reserveCapacity: number | null;
  image: string | null;
  adminNote: string | null;
}>;

export interface AdminBikeRepository {
  findPending(): Promise<BikeEntity[]>;
  findById(bikeId: number): Promise<BikeEntity | null>;
  findActiveByVariantExcludingId(input: {
    bikeId: number;
    brand: string;
    model: string;
    engineCc: number;
    modelYear: number;
  }): Promise<BikeEntity | null>;
  updateBike(bikeId: number, input: EditBikeInput): Promise<BikeEntity>;
  activateBike(bikeId: number): Promise<BikeEntity>;
  deleteBike(bikeId: number): Promise<void>;
}
