import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import type { CommunityRepository, CommunityBikesQuery, FuelRecordRow, MaintenanceRecordRow } from '../../domain/repositories/community.repository';
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

    return Promise.all(
      bikes.map(async (bike) => {
        const totalOwners = await this.prisma.userBike.count({ where: { bikeId: bike.id } });

        const fuelRows = await this.prisma.fuelRecord.findMany({
          where: { userBike: { bikeId: bike.id }, tripMeterReading: { gt: 0 }, fuelLiter: { gt: 0 } },
          select: { tripMeterReading: true, fuelLiter: true },
        });

        const totalDist = fuelRows.reduce((s, r) => s + (r.tripMeterReading ?? 0), 0);
        const totalFuel = fuelRows.reduce((s, r) => s + (r.fuelLiter ?? 0), 0);
        const avgMileage = totalFuel > 0 ? parseFloat((totalDist / totalFuel).toFixed(2)) : 0;

        return {
          id: bike.id,
          brand: bike.brand,
          model: bike.model,
          engineCc: bike.engineCc,
          modelYear: bike.modelYear,
          fuelType: bike.fuelType,
          image: bike.image,
          stats: { avgMileage, totalOwners },
        };
      }),
    );
  }

  async getBikeById(bikeId: number) {
    return this.prisma.bike.findUnique({
      where: { id: bikeId, isActive: true },
      select: { id: true, brand: true, model: true, engineCc: true, modelYear: true, fuelType: true, image: true },
    });
  }

  async getBikeFuelRecords(bikeId: number): Promise<FuelRecordRow[]> {
    return this.prisma.fuelRecord.findMany({
      where: { userBike: { bikeId }, tripMeterReading: { gt: 0 }, fuelLiter: { gt: 0 } },
      select: { userBikeId: true, tripMeterReading: true, fuelLiter: true },
    });
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
