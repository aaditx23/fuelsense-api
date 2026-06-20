export type BikeEntity = {
  id: number;
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: string;
  image: string | null;
};

export type BrandBreakdown = {
  name: string;
  percentage: number;
};

export type PartProfileEntity = {
  category: string;
  avgCost: number;
  changeIntervalKm: { min: number; avg: number; max: number } | null;
  brands: BrandBreakdown[];
};

export type MileageStatsEntity = {
  avg: number;
  min: number;
  max: number;
  sampleSize: number;
};

export type BikeCommunityProfileEntity = {
  bike: BikeEntity;
  mileage: MileageStatsEntity;
  parts: PartProfileEntity[];
  totalContributors: number;
};
