import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Body of `PATCH /maintenance/:id`. Every field is optional and only the
 * ones sent are changed; `description` and `partsBrand` accept `null` to clear
 * them. The bike a log belongs to cannot be changed.
 */
export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ minimum: 0, example: 12345.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerReading?: number;

  @ApiPropertyOptional({ example: 'ENGINE_OIL' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({ example: 'Changed engine oil', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ minimum: 0, example: 550 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partsCost?: number;

  @ApiPropertyOptional({ minimum: 0, example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @ApiPropertyOptional({ example: 'Motul', nullable: true })
  @IsOptional()
  @IsString()
  partsBrand?: string | null;

  @ApiPropertyOptional({ example: '2026-06-19T17:14:00.000Z' })
  @IsOptional()
  @IsString()
  serviceDate?: string;
}
