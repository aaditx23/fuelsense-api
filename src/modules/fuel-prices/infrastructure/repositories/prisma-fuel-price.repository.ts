import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  FuelPriceEntity,
  FuelPriceSummary,
} from '../../domain/entities/fuel-price.entity';
import { FuelPriceRepository } from '../../domain/repositories/fuel-price.repository';

@Injectable()
export class PrismaFuelPriceRepository implements FuelPriceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(): Promise<FuelPriceEntity | null> {
    const row = await this.prisma.fuelPrice.findFirst({
      orderBy: { date: 'desc' },
    });

    return row;
  }

  async findAll(): Promise<FuelPriceEntity[]> {
    const rows = await this.prisma.fuelPrice.findMany({
      orderBy: { date: 'asc' },
    });

    return rows;
  }

  async getSummary(): Promise<FuelPriceSummary> {
    const summary = await this.prisma.fuelPrice.aggregate({
      _avg: {
        diesel: true,
        petrol: true,
        octane: true,
      },
    });

    return {
      dieselAvg: summary._avg.diesel,
      petrolAvg: summary._avg.petrol,
      octaneAvg: summary._avg.octane,
    };
  }

  async saveIfChanged(input: {
    date: Date;
    diesel: number | null;
    petrol: number | null;
    octane: number | null;
  }): Promise<{ record: FuelPriceEntity; inserted: boolean }> {
    const latest = await this.findLatest();

    if (
      latest &&
      latest.diesel === input.diesel &&
      latest.petrol === input.petrol &&
      latest.octane === input.octane
    ) {
      return {
        record: latest,
        inserted: false,
      };
    }

    const date = new Date(input.date);
    date.setHours(0, 0, 0, 0);

    try {
      const created = await this.prisma.fuelPrice.create({
        data: {
          date,
          diesel: input.diesel,
          petrol: input.petrol,
          octane: input.octane,
        },
      });

      return {
        record: created,
        inserted: true,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const fallback = await this.findLatest();
        if (fallback) {
          return {
            record: fallback,
            inserted: false,
          };
        }
      }

      throw error;
    }
  }
}
