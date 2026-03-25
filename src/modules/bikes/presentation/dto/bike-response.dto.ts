import { BikeEntity } from '../../domain/entities/bike.entity';

export class BikeResponseDto {
  id!: number;
  brand!: string;
  model!: string;
  engineCc!: number;
  modelYear!: number;
  fuelType!: 'PETROL' | 'DIESEL' | 'OCTANE';
  expectedMileage!: number;
  tankCapacity!: number;
  reserveCapacity!: number | null;
  image!: string | null;
  isActive!: boolean;
  submittedById!: number | null;
  adminNote!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: BikeEntity): BikeResponseDto {
    return {
      id: entity.id,
      brand: entity.brand,
      model: entity.model,
      engineCc: entity.engineCc,
      modelYear: entity.modelYear,
      fuelType: entity.fuelType,
      expectedMileage: entity.expectedMileage,
      tankCapacity: entity.tankCapacity,
      reserveCapacity: entity.reserveCapacity,
      image: entity.image,
      isActive: entity.isActive,
      submittedById: entity.submittedById,
      adminNote: entity.adminNote,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
