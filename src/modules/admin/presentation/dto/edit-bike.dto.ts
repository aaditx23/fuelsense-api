import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EditBikeDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ minimum: 50, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(50)
  engineCc?: number;

  @ApiPropertyOptional({ minimum: 1900, maximum: 2100, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  modelYear?: number;

  @ApiPropertyOptional({ enum: ['PETROL', 'DIESEL', 'OCTANE'], nullable: true })
  @IsOptional()
  @IsIn(['PETROL', 'DIESEL', 'OCTANE'])
  fuelType?: 'PETROL' | 'DIESEL' | 'OCTANE';

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expectedMileage?: number;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  tankCapacity?: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reserveCapacity?: number | null;

  @ApiPropertyOptional({ description: 'Base64 encoded image', nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
