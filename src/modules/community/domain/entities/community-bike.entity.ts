export type CommunityBikeEntity = {
  id: number;
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: string;
  image: string | null;
  stats: {
    avgMileage: number;
    totalOwners: number;
  };
};
