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
    const userBike = await this.prisma.userBike.findFirst({
      where: {
        id: userBikeId,
        userId,
      },
    });

    return !!userBike;
  }

  async countByUserBike(userBikeId: number): Promise<number> {
    return this.prisma.fuelRecord.count({
      where: {
        userBikeId,
      },
    });
  }

  async createRefuelRecord(input: CreateRefuelInput): Promise<RefuelRecordEntity> {
    const record = await this.prisma.fuelRecord.create({
      data: {
        userId: input.userId,
        userBikeId: input.userBikeId,
        odometerReading: input.odometerReading ?? null,
        tripMeterReading: input.tripMeterReading ?? null,
        tripMeterAtReserve: input.tripMeterAtReserve ?? null,
        odometerAtReserve: input.odometerAtReserve ?? null,
        fuelLiter: input.fuelLiter ?? null,
        fuelPrice: input.fuelPrice ?? null,
      },
    });

    return record;
  }

  async getUserRefuelRecords(userId: number): Promise<RefuelRecordEntity[]> {
    const rows = await this.prisma.fuelRecord.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rows;
  }
}
