import { Injectable } from '@nestjs/common';
import { FuelType, UserRole } from '@prisma/client';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileById(userId: number): Promise<UserProfileEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBikes: {
          include: {
            bike: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const bikes = user.userBikes
      .map((it) => it.bike)
      .filter((bike) => bike.isActive)
      .map((bike) => ({
        id: bike.id,
        brand: bike.brand,
        model: bike.model,
        engineCc: bike.engineCc,
        modelYear: bike.modelYear,
        fuelType: bike.fuelType as FuelType,
        expectedMileage: bike.expectedMileage,
        tankCapacity: bike.tankCapacity,
        reserveCapacity: bike.reserveCapacity,
        image: bike.image,
        isActive: bike.isActive,
        submittedById: bike.submittedById,
        adminNote: bike.adminNote,
        createdAt: bike.createdAt,
        updatedAt: bike.updatedAt,
      }));

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
      profileImage: user.profileImage,
      bikes,
    };
  }

  async deleteById(userId: number): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
