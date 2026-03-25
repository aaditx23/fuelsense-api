import { Injectable } from '@nestjs/common';
import { FuelType } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { BikeEntity } from '../../domain/entities/bike.entity';
import {
  BikeRepository,
  SubmitBikeInput,
} from '../../domain/repositories/bike.repository';

@Injectable()
export class PrismaBikeRepository implements BikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(): Promise<BikeEntity[]> {
    const bikes = await this.prisma.bike.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return bikes.map(this.mapToEntity);
  }

  async findMyActiveBikes(userId: number): Promise<BikeEntity[]> {
    const userBikes = await this.prisma.userBike.findMany({
      where: {
        userId,
        bike: {
          isActive: true,
        },
      },
      include: {
        bike: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return userBikes.map((row) => this.mapToEntity(row.bike));
  }

  async findByVariant(
    input: Pick<SubmitBikeInput, 'brand' | 'model' | 'engineCc' | 'modelYear'>,
  ): Promise<BikeEntity | null> {
    const bike = await this.prisma.bike.findUnique({
      where: {
        brand_model_engineCc_modelYear: {
          brand: input.brand,
          model: input.model,
          engineCc: input.engineCc,
          modelYear: input.modelYear,
        },
      },
    });

    return bike ? this.mapToEntity(bike) : null;
  }

  async createPending(input: SubmitBikeInput): Promise<BikeEntity> {
    const bike = await this.prisma.bike.create({
      data: {
        brand: input.brand,
        model: input.model,
        engineCc: input.engineCc,
        modelYear: input.modelYear,
        fuelType: input.fuelType as FuelType,
        expectedMileage: input.expectedMileage,
        tankCapacity: input.tankCapacity,
        reserveCapacity: input.reserveCapacity ?? null,
        image: input.image ?? null,
        submittedById: input.submittedById ?? null,
        isActive: false,
      },
    });

    return this.mapToEntity(bike);
  }

  async findById(bikeId: number): Promise<BikeEntity | null> {
    const bike = await this.prisma.bike.findUnique({ where: { id: bikeId } });
    return bike ? this.mapToEntity(bike) : null;
  }

  async hasUserBikeSelection(userId: number, bikeId: number): Promise<boolean> {
    const userBike = await this.prisma.userBike.findUnique({
      where: {
        userId_bikeId: {
          userId,
          bikeId,
        },
      },
    });

    return !!userBike;
  }

  async selectBike(userId: number, bikeId: number): Promise<void> {
    await this.prisma.userBike.create({
      data: {
        userId,
        bikeId,
      },
    });
  }

  async removeBikeSelection(userId: number, bikeId: number): Promise<boolean> {
    const result = await this.prisma.userBike.deleteMany({
      where: {
        userId,
        bikeId,
      },
    });

    return result.count > 0;
  }

  private mapToEntity(bike: {
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
