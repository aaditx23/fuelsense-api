import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { FuelTypeName } from '../../domain/entities/fuel-price.entity';

export const MAX_HISTORY_DAYS = 730;
export const DEFAULT_HISTORY_DAYS = 90;

export class FuelPriceHistoryQueryDto {
  @ApiProperty({ enum: ['PETROL', 'DIESEL', 'OCTANE'], example: 'PETROL' })
  @IsIn(['PETROL', 'DIESEL', 'OCTANE'])
  fuelType!: FuelTypeName;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_HISTORY_DAYS,
    default: DEFAULT_HISTORY_DAYS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_HISTORY_DAYS)
  days?: number;
}
