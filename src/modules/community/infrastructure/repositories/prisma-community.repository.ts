import { perBikeMileages } from '../../../../common/fuel/mileage-calculator';
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

        const fuelRows = await this.getBikeFuelRecords(bike.id);
        const mileages = perBikeMileages(fuelRows);
        const avgMileage =
          mileages.length > 0
            ? parseFloat((mileages.reduce((s, v) => s + v, 0) / mileages.length).toFixed(2))
            : 0;

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
      where: { userBike: { bikeId } },
      select: {
        userBikeId: true,
        entryType: true,
        odometerAtReserve: true,
        fuelLiter: true,
        createdAt: true,
      },
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
