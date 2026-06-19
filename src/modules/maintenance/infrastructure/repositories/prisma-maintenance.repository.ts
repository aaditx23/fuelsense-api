import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import {
  CreateMaintenanceInput,
  MaintenanceRepository,
} from '../../domain/repositories/maintenance.repository';

@Injectable()
export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isUserBikeOwnedByUser(userId: number, userBikeId: number): Promise<boolean> {
    const userBike = await this.prisma.userBike.findUnique({
      where: {
        userId_bikeId: {
          userId,
          bikeId: userBikeId,
        },
      },
    });
    return !!userBike;
  }

  async createMaintenanceRecord(input: CreateMaintenanceInput): Promise<MaintenanceRecordEntity> {
    const userBike = await this.prisma.userBike.findUnique({
      where: {
        userId_bikeId: {
          userId: input.userId,
          bikeId: input.userBikeId,
        },
      },
    });

    if (!userBike) {
      throw new Error('UserBike association not found');
    }

    // Auto-upsert part name in parts catalog
    await this.prisma.part.upsert({
      where: { name: input.category },
      update: {},
      create: { name: input.category },
    });

    const record = await this.prisma.maintenanceRecord.create({
      data: {
        userId: input.userId,
        userBikeId: userBike.id,
        odometerReading: input.odometerReading,
        category: input.category,
        description: input.description ?? null,
        partsCost: input.partsCost ?? 0,
        laborCost: input.laborCost ?? 0,
        partsBrand: input.partsBrand ?? null,
        serviceDate: input.serviceDate ?? undefined,
      },
    });
    return {
      ...record,
      userBikeId: input.userBikeId,
    };
  }

  async getUserMaintenanceLogs(userId: number): Promise<MaintenanceRecordEntity[]> {
    const rows = await this.prisma.maintenanceRecord.findMany({
      where: {
        userId,
      },
      include: {
        userBike: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return rows.map((row) => ({
      ...row,
      userBikeId: row.userBike.bikeId,
    }));
  }

  async getBikeModelMaintenanceLogs(bikeId: number): Promise<MaintenanceRecordEntity[]> {
    const rows = await this.prisma.maintenanceRecord.findMany({
      where: {
        userBike: {
          bikeId,
        },
      },
      orderBy: {
        odometerReading: 'asc',
      },
    });
    return rows;
  }

  async getBikeModelUserBikes(bikeId: number): Promise<{ id: number; userId: number; createdAt: Date }[]> {
    const rows = await this.prisma.userBike.findMany({
      where: {
        bikeId,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });
    return rows;
  }

  async getBikeModelFuelRecords(
    bikeId: number,
  ): Promise<
    {
      id: number;
      userBikeId: number;
      tripMeterReading: number | null;
      fuelLiter: number | null;
    }[]
  > {
    const rows = await this.prisma.fuelRecord.findMany({
      where: {
        userBike: {
          bikeId,
        },
      },
      select: {
        id: true,
        userBikeId: true,
        tripMeterReading: true,
        fuelLiter: true,
      },
    });
    return rows;
  }

  async getRegisteredParts(): Promise<string[]> {
    const rows = await this.prisma.part.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    const dbParts = rows.map((r) => r.name);
    const defaults = ['ENGINE_OIL', 'SPARK_PLUG', 'BRAKE_PADS'];
    return [...new Set([...defaults, ...dbParts])].sort();
  }
}
