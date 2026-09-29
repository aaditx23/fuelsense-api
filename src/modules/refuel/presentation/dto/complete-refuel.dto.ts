import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Body of `PATCH /refuel/:id` — completes a RESERVE_INCOMPLETE marker. */
export class CompleteRefuelDto {
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
