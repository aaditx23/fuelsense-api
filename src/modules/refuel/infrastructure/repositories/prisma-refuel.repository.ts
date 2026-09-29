import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { RefuelRecordEntity } from '../../domain/entities/refuel-record.entity';
import {
  CompleteRefuelInput,
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

  async hasIncompleteReserve(userId: number, userBikeId: number): Promise<boolean> {
    const count = await this.prisma.fuelRecord.count({
      where: {
        userId,
        entryType: 'RESERVE_INCOMPLETE',
        userBike: {
          bikeId: userBikeId,
        },
      },
    });

    return count > 0;
  }

  async findOwnedRecord(userId: number, id: number): Promise<RefuelRecordEntity | null> {
    const row = await this.prisma.fuelRecord.findFirst({
      where: { id, userId },
      include: { userBike: true },
    });

    return row ? { ...row, userBikeId: row.userBike.bikeId } : null;
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
        entryType: input.entryType,
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

  async completeReserveRecord(
    id: number,
    input: CompleteRefuelInput,
  ): Promise<RefuelRecordEntity> {
    const record = await this.prisma.fuelRecord.update({
      where: { id },
      data: {
        entryType: 'RESERVE_COMPLETE',
        odometerReading: input.odometerReading ?? null,
        tripMeterReading: input.tripMeterReading ?? null,
        fuelLiter: input.fuelLiter ?? null,
        fuelPrice: input.fuelPrice ?? null,
      },
      include: { userBike: true },
    });

    return { ...record, userBikeId: record.userBike.bikeId };
  }

  async deleteRefuelRecord(id: number): Promise<void> {
    await this.prisma.fuelRecord.delete({ where: { id } });
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
