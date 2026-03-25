import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefuelDto {
  @ApiProperty({ minimum: 1, example: 45, description: 'User bike ID (mandatory)' })
  @IsInt()
  @Min(1)
  userBikeId!: number;

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
