export class BikeAnalyticsResponseDto {
  realMileage!: number;
  averageMonthlyCost!: number;
  reliabilityScore!: number;
  consumablesLifespan!: Record<string, number>;
}
