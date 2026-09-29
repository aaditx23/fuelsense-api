import type { MileageSample } from '../../../../common/fuel/mileage-calculator';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import type { CommunityRepository, CommunityBikesQuery, MaintenanceRecordRow } from '../../domain/repositories/community.repository';
import type { CommunityBikeEntity } from '../../domain/entities/community-bike.entity';

@Injectable()
export class PrismaCommunityRepository implements CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBikesWithStats(query: CommunityBikesQuery): Promise<CommunityBikeEntity[]> {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const bikes = await this.prisma.bike.findMany({
      where: {
        isActive: true,
        OR: search
          ? [
              { brand: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      skip,
      take: limit,
      orderBy: { brand: 'asc' },
    });

    if (bikes.length === 0) return [];

    // One aggregate over the page's bikes, reading the stored per-bike totals.
    const stats = await this.prisma.$queryRaw<
      { bikeId: number; owners: number; avgMileage: number | null }[]
    >(Prisma.sql`
      SELECT bike_id AS "bikeId",
             COUNT(*)::int AS owners,
             AVG(mileage_distance / mileage_fuel) FILTER (WHERE mileage_fuel > 0) AS "avgMileage"
      FROM user_bikes
      WHERE bike_id IN (${Prisma.join(bikes.map((b) => b.id))})
      GROUP BY bike_id
    `);
    const statsByBike = new Map(stats.map((s) => [s.bikeId, s]));

    return bikes.map((bike) => {
      const stat = statsByBike.get(bike.id);
      return {
        id: bike.id,
        brand: bike.brand,
        model: bike.model,
        engineCc: bike.engineCc,
        modelYear: bike.modelYear,
        fuelType: bike.fuelType,
        image: bike.image,
        stats: {
          avgMileage: stat?.avgMileage ? parseFloat(Number(stat.avgMileage).toFixed(2)) : 0,
          totalOwners: stat?.owners ?? 0,
        },
      };
    });
  }

  async getBikeById(bikeId: number) {
    return this.prisma.bike.findUnique({
      where: { id: bikeId, isActive: true },
      select: { id: true, brand: true, model: true, engineCc: true, modelYear: true, fuelType: true, image: true },
    });
  }

  async getBikeMileageSamples(bikeId: number): Promise<MileageSample[]> {
    const rows = await this.prisma.userBike.findMany({
      where: { bikeId, mileageFuel: { gt: 0 } },
      select: { mileageDistance: true, mileageFuel: true },
    });
    return rows.map((r) => ({ distance: r.mileageDistance, fuel: r.mileageFuel }));
  }

  async getBikeFuelContributorIds(bikeId: number): Promise<number[]> {
    const rows = await this.prisma.fuelRecord.findMany({
      where: { userBike: { bikeId } },
      select: { userBikeId: true },
      distinct: ['userBikeId'],
    });
    return rows.map((r) => r.userBikeId);
  }

  async getBikeMaintenanceRecords(bikeId: number): Promise<MaintenanceRecordRow[]> {
    return this.prisma.maintenanceRecord.findMany({
      where: { userBike: { bikeId } },
      select: {
        userBikeId: true,
        category: true,
        odometerReading: true,
        partsCost: true,
        laborCost: true,
        partsBrand: true,
      },
      orderBy: { odometerReading: 'asc' },
    });
  }
}
