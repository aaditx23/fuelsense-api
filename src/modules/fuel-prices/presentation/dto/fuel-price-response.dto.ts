import { FuelPriceEntity } from '../../domain/entities/fuel-price.entity';

export class FuelPriceDetailDto {
  price!: number | null;
  updatedAt!: Date;
  effectiveFrom!: Date | null;
  createdAt!: Date;
}

export class FuelPriceResponseDto {
  diesel!: FuelPriceDetailDto;
  petrol!: FuelPriceDetailDto;
  octane!: FuelPriceDetailDto;

  static fromEntity(entity: FuelPriceEntity): FuelPriceResponseDto {
    return {
      diesel: entity.diesel,
      petrol: entity.petrol,
      octane: entity.octane,
    };
  }
}
