import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  LeaderboardBikeSummary,
  LeaderboardRepository,
  LeaderboardStatRow,
  LeaderboardStatWithBike,
} from '../../domain/repositories/leaderboard.repository';
import type {
  LeaderboardPeriod,
  OwnerActivity,
} from '../../domain/services/leaderboard-calculator';

const BIKE_SELECT = {
  id: true,
  brand: true,
  model: true,
  engineCc: true,
  modelYear: true,
  fuelType: true,
  image: true,
  expectedMileage: true,
} as const;

@Injectable()
export class PrismaLeaderboardRepository implements LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  getBikeCatalog(): Promise<LeaderboardBikeSummary[]> {
    return this.prisma.bike.findMany({
      where: { isActive: true },
      select: BIKE_SELECT,
      orderBy: { id: 'asc' },
    });
  }

  async loadBikeActivity(bikeId: number): Promise<OwnerActivity[]> {
    const userBikes = await this.prisma.userBike.findMany({
      where: { bikeId },
      select: {
        fuelRecords: {
          select: {
            userBikeId: true,
            entryType: true,
            odometerAtReserve: true,
            odometerReading: true,
            fuelLiter: true,
            fuelPrice: true,
            createdAt: true,
          },
        },
        maintenanceRecords: {
          select: {
            serviceDate: true,
            odometerReading: true,
            partsCost: true,
            laborCost: true,
          },
        },
      },
    });

    return userBikes.map((userBike) => ({
      fuel: userBike.fuelRecords.map(({ fuelPrice, ...record }) => ({
        ...record,
        amount: fuelPrice,
      })),
      maintenance: userBike.maintenanceRecords.map((record) => ({
        serviceDate: record.serviceDate,
        odometerReading: record.odometerReading,
        cost: record.partsCost + record.laborCost,
      })),
    }));
  }

  async replaceStats(rows: LeaderboardStatRow[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.bikeLeaderboardStat.deleteMany(),
      this.prisma.bikeLeaderboardStat.createMany({
        data: rows.map((row) => ({
          bikeId: row.bikeId,
          period: row.period,
          ownerCount: row.ownerCount,
          runningOwnerCount: row.runningOwnerCount,
          maintenanceOwnerCount: row.maintenanceOwnerCount,
          avgMileage: row.avgMileage,
          claimRatio: row.claimRatio,
          runningCostPerKm: row.runningCostPerKm,
          maintenanceCostPer1000Km: row.maintenanceCostPer1000Km,
          updatedAt: row.updatedAt,
        })),
      }),
    ]);
  }

  countStats(): Promise<number> {
    return this.prisma.bikeLeaderboardStat.count();
  }

  async findStats(period: LeaderboardPeriod): Promise<LeaderboardStatWithBike[]> {
    const rows = await this.prisma.bikeLeaderboardStat.findMany({
      where: { period, bike: { isActive: true } },
      include: { bike: { select: BIKE_SELECT } },
    });

    return rows.map(({ bike, ...row }) => ({
      bikeId: row.bikeId,
      period: row.period as LeaderboardPeriod,
      ownerCount: row.ownerCount,
      runningOwnerCount: row.runningOwnerCount,
      maintenanceOwnerCount: row.maintenanceOwnerCount,
      avgMileage: row.avgMileage,
      claimRatio: row.claimRatio,
      runningCostPerKm: row.runningCostPerKm,
      maintenanceCostPer1000Km: row.maintenanceCostPer1000Km,
      updatedAt: row.updatedAt,
      bike,
    }));
  }
}
