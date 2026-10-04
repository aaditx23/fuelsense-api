import { FuelPriceHistoryPoint } from '../../domain/entities/fuel-price.entity';

export class FuelPriceHistoryPointDto {
  effectiveDate!: Date;
  price!: number;

  static fromEntity(point: FuelPriceHistoryPoint): FuelPriceHistoryPointDto {
    return { effectiveDate: point.effectiveDate, price: point.price };
  }
}
