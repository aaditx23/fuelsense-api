import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { BikeAnalyticsResponseDto } from '../../presentation/dto/bike-analytics-response.dto';
import { MAINTENANCE_REPOSITORY } from '../../domain/repositories/maintenance.repository';
import type { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class GetBikeAnalyticsUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async execute(bikeId: number): Promise<UnifiedResponse<BikeAnalyticsResponseDto>> {
    // 1. Real Mileage
    const fuelRecords = await this.maintenanceRepository.getBikeModelFuelRecords(bikeId);
    let totalDistance = 0;
    let totalFuel = 0;
    for (const record of fuelRecords) {
      if (
        record.tripMeterReading != null &&
        record.tripMeterReading > 0 &&
        record.fuelLiter != null &&
        record.fuelLiter > 0
      ) {
        totalDistance += record.tripMeterReading;
        totalFuel += record.fuelLiter;
      }
    }
    const realMileage = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0.0;

    // 2. User bikes and maintenance records
    const userBikes = await this.maintenanceRepository.getBikeModelUserBikes(bikeId);
    const maintenanceLogs = await this.maintenanceRepository.getBikeModelMaintenanceLogs(bikeId);

    const now = new Date();

    // Group logs by userBikeId
    const logsByUserBike: Record<number, typeof maintenanceLogs> = {};
    for (const log of maintenanceLogs) {
      if (!logsByUserBike[log.userBikeId]) {
        logsByUserBike[log.userBikeId] = [];
      }
      logsByUserBike[log.userBikeId].push(log);
    }

    let totalMonthlyCostsSum = 0;
    let totalBikesForUpkeep = 0;

    let totalReliabilitySum = 0;
    let totalBikesForReliability = 0;

    // Group intervals by category across all user bikes
    const categoryIntervals: Record<string, number[]> = {};

    for (const bike of userBikes) {
      const bikeLogs = logsByUserBike[bike.id] || [];

      // Calculate age in months
      const createdAt = new Date(bike.createdAt);
      const diffMonths =
        (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
      const ageInMonths = Math.max(1, diffMonths);

      // A. Upkeep Cost
      const totalCost = bikeLogs.reduce((sum, log) => sum + (log.partsCost || 0) + (log.laborCost || 0), 0);
      const monthlyCost = totalCost / ageInMonths;
      totalMonthlyCostsSum += monthlyCost;
      totalBikesForUpkeep++;

      // B. Reliability
      const unscheduledLogs = bikeLogs.filter((log) => log.category === 'OTHER');
      const unscheduledCount = unscheduledLogs.length;
      const years = ageInMonths / 12;
      const yearlyFrequency = unscheduledCount / years;
      const deduction = 0.5 * yearlyFrequency;
      const reliabilityScore = Math.max(1.0, 5.0 - deduction);
      totalReliabilitySum += reliabilityScore;
      totalBikesForReliability++;

      // C. Consumable intervals
      const logsByCategory: Record<string, typeof bikeLogs> = {};
      for (const log of bikeLogs) {
        if (!logsByCategory[log.category]) {
          logsByCategory[log.category] = [];
        }
        logsByCategory[log.category].push(log);
      }

      for (const [category, catLogs] of Object.entries(logsByCategory)) {
        if (catLogs.length >= 2) {
          // Sort by odometer reading
          const sorted = [...catLogs].sort((a, b) => a.odometerReading - b.odometerReading);
          let sumIntervals = 0;
          for (let i = 1; i < sorted.length; i++) {
            sumIntervals += sorted[i].odometerReading - sorted[i - 1].odometerReading;
          }
          const avgInterval = sumIntervals / (sorted.length - 1);
          if (!categoryIntervals[category]) {
            categoryIntervals[category] = [];
          }
          categoryIntervals[category].push(avgInterval);
        }
      }
    }

    const averageMonthlyCost =
      totalBikesForUpkeep > 0 ? parseFloat((totalMonthlyCostsSum / totalBikesForUpkeep).toFixed(2)) : 0.0;
    const reliabilityScore =
      totalBikesForReliability > 0
        ? parseFloat((totalReliabilitySum / totalBikesForReliability).toFixed(1))
        : 5.0;

    // Compile consumable average lifespans
    const consumablesLifespan: Record<string, number> = {};
    for (const [category, intervals] of Object.entries(categoryIntervals)) {
      if (intervals.length > 0) {
        const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        consumablesLifespan[category] = parseFloat(avg.toFixed(0));
      }
    }

    return ok({
      message: 'Bike analytics retrieved successfully',
      data: {
        realMileage,
        averageMonthlyCost,
        reliabilityScore,
        consumablesLifespan,
      },
    });
  }
}
