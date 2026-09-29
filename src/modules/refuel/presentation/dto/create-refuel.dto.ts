import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { REFUEL_ENTRY_TYPES } from '../../domain/entities/refuel-record.entity';
import type { RefuelEntryType } from '../../domain/entities/refuel-record.entity';

export class CreateRefuelDto {
  @ApiProperty({ minimum: 1, example: 45, description: 'User bike ID (mandatory)' })
  @IsInt()
  @Min(1)
  userBikeId!: number;

  @ApiPropertyOptional({
    enum: REFUEL_ENTRY_TYPES,
    description:
      'RESERVE_INCOMPLETE stores a reserve-hit marker: only tripMeterAtReserve/odometerAtReserve, no fuel data. ' +
      'When omitted it is inferred: reserve readings present => RESERVE_COMPLETE, otherwise TOPUP.',
  })
  @IsOptional()
  @IsEnum(REFUEL_ENTRY_TYPES)
  entryType?: RefuelEntryType;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 12345.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerReading?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 230.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tripMeterReading?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 180.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tripMeterAtReserve?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 12200.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerAtReserve?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 8.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelLiter?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 1120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelPrice?: number;
}
