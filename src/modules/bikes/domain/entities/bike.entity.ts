export type BikeEntity = {
  id: number;
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: 'PETROL' | 'DIESEL' | 'OCTANE';
  expectedMileage: number;
  tankCapacity: number;
  reserveCapacity: number | null;
  image: string | null;
  isActive: boolean;
  submittedById: number | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};
