import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { RefuelRecordEntity } from '../../domain/entities/refuel-record.entity';
import {
  CreateRefuelInput,
  RefuelRepository,
} from '../../domain/repositories/refuel.repository';

@Injectable()
export class PrismaRefuelRepository implements RefuelRepository {
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

  async countByUserBike(userId: number, userBikeId: number): Promise<number> {
    return this.prisma.fuelRecord.count({
      where: {
        userId,
        userBike: {
          bikeId: userBikeId,
        },
      },
    });
  }

  async createRefuelRecord(input: CreateRefuelInput): Promise<RefuelRecordEntity> {
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

    const record = await this.prisma.fuelRecord.create({
      data: {
        userId: input.userId,
        userBikeId: userBike.id,
        odometerReading: input.odometerReading ?? null,
        tripMeterReading: input.tripMeterReading ?? null,
        tripMeterAtReserve: input.tripMeterAtReserve ?? null,
        odometerAtReserve: input.odometerAtReserve ?? null,
        fuelLiter: input.fuelLiter ?? null,
        fuelPrice: input.fuelPrice ?? null,
      },
    });

    return {
      ...record,
      userBikeId: input.userBikeId,
    };
  }

  async getUserRefuelRecords(userId: number): Promise<RefuelRecordEntity[]> {
    const rows = await this.prisma.fuelRecord.findMany({
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
}
