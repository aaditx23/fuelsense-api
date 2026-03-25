import { Injectable } from '@nestjs/common';
import { FuelType } from '@prisma/client';
import { BikeEntity } from '../../../bikes/domain/entities/bike.entity';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  AdminBikeRepository,
  EditBikeInput,
} from '../../domain/repositories/admin-bike.repository';

@Injectable()
export class PrismaAdminBikeRepository implements AdminBikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(): Promise<BikeEntity[]> {
    const bikes = await this.prisma.bike.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' },
    });

    return bikes.map((bike) => this.toEntity(bike));
  }

  async findById(bikeId: number): Promise<BikeEntity | null> {
    const bike = await this.prisma.bike.findUnique({ where: { id: bikeId } });
    return bike ? this.toEntity(bike) : null;
  }

  async findActiveByVariantExcludingId(input: {
    bikeId: number;
    brand: string;
    model: string;
    engineCc: number;
    modelYear: number;
  }): Promise<BikeEntity | null> {
    const bike = await this.prisma.bike.findFirst({
      where: {
        id: { not: input.bikeId },
        isActive: true,
        brand: input.brand,
        model: input.model,
        engineCc: input.engineCc,
        modelYear: input.modelYear,
      },
    });

    return bike ? this.toEntity(bike) : null;
  }

  async updateBike(bikeId: number, input: EditBikeInput): Promise<BikeEntity> {
    const bike = await this.prisma.bike.update({
      where: { id: bikeId },
      data: {
        brand: input.brand,
        model: input.model,
        engineCc: input.engineCc,
        modelYear: input.modelYear,
        fuelType: input.fuelType as FuelType | undefined,
        expectedMileage: input.expectedMileage,
        tankCapacity: input.tankCapacity,
        reserveCapacity: input.reserveCapacity,
        image: input.image,
        adminNote: input.adminNote,
      },
    });

    return this.toEntity(bike);
  }

  async activateBike(bikeId: number): Promise<BikeEntity> {
    const bike = await this.prisma.bike.update({
      where: { id: bikeId },
      data: {
        isActive: true,
      },
    });

    return this.toEntity(bike);
  }

  async deleteBike(bikeId: number): Promise<void> {
    await this.prisma.bike.delete({ where: { id: bikeId } });
  }

  private toEntity(bike: {
    id: number;
    brand: string;
    model: string;
    engineCc: number;
    modelYear: number;
    fuelType: FuelType;
    expectedMileage: number;
    tankCapacity: number;
    reserveCapacity: number | null;
    image: string | null;
    isActive: boolean;
    submittedById: number | null;
    adminNote: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): BikeEntity {
    return {
      id: bike.id,
      brand: bike.brand,
      model: bike.model,
      engineCc: bike.engineCc,
      modelYear: bike.modelYear,
      fuelType: bike.fuelType,
      expectedMileage: bike.expectedMileage,
      tankCapacity: bike.tankCapacity,
      reserveCapacity: bike.reserveCapacity,
      image: bike.image,
      isActive: bike.isActive,
      submittedById: bike.submittedById,
      adminNote: bike.adminNote,
      createdAt: bike.createdAt,
      updatedAt: bike.updatedAt,
    };
  }
}
