import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { COMMUNITY_REPOSITORY } from '../../domain/repositories/community.repository';
import type { CommunityRepository, MaintenanceRecordRow } from '../../domain/repositories/community.repository';
import type { BikeCommunityProfileEntity, MileageStatsEntity, PartProfileEntity } from '../../domain/entities/bike-community-profile.entity';

@Injectable()
export class GetBikeCommunityProfileUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
  ) {}

  async execute(bikeId: number): Promise<UnifiedResponse<BikeCommunityProfileEntity>> {
    const bike = await this.communityRepository.getBikeById(bikeId);
    if (!bike) throw new NotFoundException('Bike not found');

    // --- Mileage ---
    const fuelRows = await this.communityRepository.getBikeFuelRecords(bikeId);

    const mileageByOwner: Record<number, { dist: number; fuel: number }> = {};
    for (const r of fuelRows) {
      if (!mileageByOwner[r.userBikeId]) mileageByOwner[r.userBikeId] = { dist: 0, fuel: 0 };
      mileageByOwner[r.userBikeId].dist += r.tripMeterReading ?? 0;
      mileageByOwner[r.userBikeId].fuel += r.fuelLiter ?? 0;
    }

    const ownerMileages = Object.values(mileageByOwner)
      .filter((o) => o.fuel > 0)
      .map((o) => o.dist / o.fuel);

    const sampleSize = ownerMileages.length;
    const mileage: MileageStatsEntity =
      sampleSize > 0
        ? {
            avg: parseFloat((ownerMileages.reduce((s, v) => s + v, 0) / sampleSize).toFixed(2)),
            min: parseFloat(Math.min(...ownerMileages).toFixed(2)),
            max: parseFloat(Math.max(...ownerMileages).toFixed(2)),
            sampleSize,
          }
        : { avg: 0, min: 0, max: 0, sampleSize: 0 };

    // --- Parts ---
    const maintenanceRows = await this.communityRepository.getBikeMaintenanceRecords(bikeId);

    const byCategory: Record<string, MaintenanceRecordRow[]> = {};
    for (const r of maintenanceRows) {
      (byCategory[r.category] ??= []).push(r);
    }

    const parts: PartProfileEntity[] = Object.entries(byCategory).map(([category, rows]) => {
      const avgCost = parseFloat(
        (rows.reduce((s, r) => s + (r.partsCost ?? 0) + (r.laborCost ?? 0), 0) / rows.length).toFixed(2),
      );

      // Change interval: consecutive odometer diffs per user-bike
      const rowsByUserBike: Record<number, MaintenanceRecordRow[]> = {};
      for (const r of rows) (rowsByUserBike[r.userBikeId] ??= []).push(r);

      const intervals: number[] = [];
      for (const ubRows of Object.values(rowsByUserBike)) {
        const sorted = [...ubRows].sort((a, b) => a.odometerReading - b.odometerReading);
        for (let i = 1; i < sorted.length; i++) {
          const diff = sorted[i].odometerReading - sorted[i - 1].odometerReading;
          if (diff > 0) intervals.push(diff);
        }
      }

      const changeIntervalKm =
        intervals.length > 0
          ? {
              min: Math.round(Math.min(...intervals)),
              avg: Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length),
              max: Math.round(Math.max(...intervals)),
            }
          : null;

      // Brand breakdown
      const brandCounts: Record<string, number> = {};
      for (const r of rows) {
        const b = r.partsBrand?.trim() || 'Unknown';
        brandCounts[b] = (brandCounts[b] ?? 0) + 1;
      }
      const total = rows.length;
      const brands = Object.entries(brandCounts)
        .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }))
        .sort((a, b) => b.percentage - a.percentage);

      return { category, avgCost, changeIntervalKm, brands };
    });

    // Count distinct reviewers: anyone who logged a refuel OR maintenance for this bike
    const reviewerIds = new Set([
      ...fuelRows.map((r) => r.userBikeId),
      ...maintenanceRows.map((r) => r.userBikeId),
    ]);
    const totalContributors = reviewerIds.size;

    return ok({
      message: 'Bike community profile fetched successfully',
      data: { bike, mileage, parts, totalContributors },
    });
  }
}
