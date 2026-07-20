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
    const [dieselRow, petrolRow, octaneRow] = await Promise.all([
      this.prisma.fuelPrice.findFirst({
        where: { fuelType: 'DIESEL' },
        orderBy: { effectiveDate: 'desc' },
      }),
      this.prisma.fuelPrice.findFirst({
        where: { fuelType: 'PETROL' },
        orderBy: { effectiveDate: 'desc' },
      }),
      this.prisma.fuelPrice.findFirst({
        where: { fuelType: 'OCTANE' },
        orderBy: { effectiveDate: 'desc' },
      }),
    ]);

    if (!dieselRow && !petrolRow && !octaneRow) {
      return null;
    }

    const mapRow = (row: any) => {
      if (!row) {
        return {
          price: null,
          updatedAt: new Date(0),
          effectiveFrom: null,
          createdAt: new Date(0),
        };
      }
      return {
        price: row.price,
        updatedAt: row.updatedAt,
        effectiveFrom: row.effectiveDate,
        createdAt: row.createdAt,
      };
    };

    return {
      diesel: mapRow(dieselRow),
      petrol: mapRow(petrolRow),
      octane: mapRow(octaneRow),
    };
  }

  async findAll(): Promise<FuelPriceEntity[]> {
    const rows = await this.prisma.fuelPrice.findMany({
      orderBy: { effectiveDate: 'asc' },
    });

    const groups: Map<string, {
      diesel: any;
      petrol: any;
      octane: any;
    }> = new Map();

    for (const row of rows) {
      const dateStr = row.effectiveDate.toISOString().split('T')[0];
      if (!groups.has(dateStr)) {
        groups.set(dateStr, {
          diesel: null,
          petrol: null,
          octane: null,
        });
      }
      const grp = groups.get(dateStr)!;
      const detail = {
        price: row.price,
        updatedAt: row.updatedAt,
        effectiveFrom: row.effectiveDate,
        createdAt: row.createdAt,
      };
      if (row.fuelType === 'DIESEL') grp.diesel = detail;
      if (row.fuelType === 'PETROL') grp.petrol = detail;
      if (row.fuelType === 'OCTANE') grp.octane = detail;
    }

    const entities: FuelPriceEntity[] = [];
    const emptyDetail = (date: Date) => ({
      price: null,
      updatedAt: new Date(0),
      effectiveFrom: date,
      createdAt: new Date(0),
    });

    for (const [dateStr, value] of groups.entries()) {
      const date = new Date(dateStr);
      entities.push({
        diesel: value.diesel ?? emptyDetail(date),
        petrol: value.petrol ?? emptyDetail(date),
        octane: value.octane ?? emptyDetail(date),
      });
    }

    return entities;
  }

  async getSummary(): Promise<FuelPriceSummary> {
    const averages = await this.prisma.fuelPrice.groupBy({
      by: ['fuelType'],
      _avg: {
        price: true,
      },
    });

    const getAvg = (type: 'DIESEL' | 'PETROL' | 'OCTANE') =>
      averages.find((a) => a.fuelType === type)?._avg.price ?? null;

    return {
      dieselAvg: getAvg('DIESEL'),
      petrolAvg: getAvg('PETROL'),
      octaneAvg: getAvg('OCTANE'),
    };
  }

  async saveIfChanged(input: {
    diesel: { price: number | null; effectiveDate: Date | null };
    petrol: { price: number | null; effectiveDate: Date | null };
    octane: { price: number | null; effectiveDate: Date | null };
  }): Promise<{ record: FuelPriceEntity; inserted: boolean }> {
    let inserted = false;

    const upsertFuel = async (
      type: 'DIESEL' | 'PETROL' | 'OCTANE',
      detail: { price: number | null; effectiveDate: Date | null }
    ) => {
      if (detail.price == null || detail.effectiveDate == null) {
        return;
      }

      const existing = await this.prisma.fuelPrice.findFirst({
        where: {
          fuelType: type,
          effectiveDate: detail.effectiveDate,
        },
      });

      if (existing) {
        await this.prisma.fuelPrice.update({
          where: { id: existing.id },
          data: {
            price: detail.price,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.fuelPrice.create({
          data: {
            fuelType: type,
            price: detail.price,
            effectiveDate: detail.effectiveDate,
          },
        });
        inserted = true;
      }
    };

    await Promise.all([
      upsertFuel('DIESEL', input.diesel),
      upsertFuel('PETROL', input.petrol),
      upsertFuel('OCTANE', input.octane),
    ]);

    const latest = await this.findLatest();
    if (!latest) {
      throw new Error('Failed to retrieve latest fuel price record after save');
    }

    return {
      record: latest,
      inserted,
    };
  }
}
