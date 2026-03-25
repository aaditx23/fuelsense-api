import { FuelPriceEntity } from '../../domain/entities/fuel-price.entity';

export class FuelPriceResponseDto {
  id!: number;
  date!: Date;
  diesel!: number | null;
  petrol!: number | null;
  octane!: number | null;
  createdAt!: Date;

  static fromEntity(entity: FuelPriceEntity): FuelPriceResponseDto {
    return {
      id: entity.id,
      date: entity.date,
      diesel: entity.diesel,
      petrol: entity.petrol,
      octane: entity.octane,
      createdAt: entity.createdAt,
    };
  }
}
