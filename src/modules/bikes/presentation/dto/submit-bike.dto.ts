import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitBikeDto {
  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Yamaha' })
  @IsString()
  brand!: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'FZS V3' })
  @IsString()
  model!: string;

  @ApiProperty({ minimum: 50, example: 149 })
  @IsInt()
  @Min(50)
  engineCc!: number;

  @ApiProperty({ minimum: 1900, maximum: 2100, example: 2023 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  modelYear!: number;

  @ApiProperty({ enum: ['PETROL', 'DIESEL', 'OCTANE'], example: 'PETROL' })
  @IsIn(['PETROL', 'DIESEL', 'OCTANE'])
  fuelType!: 'PETROL' | 'DIESEL' | 'OCTANE';

  @ApiProperty({ minimum: 1, example: 45 })
  @IsNumber()
  @Min(1)
  expectedMileage!: number;

  @ApiProperty({ minimum: 1, example: 12 })
  @IsNumber()
  @Min(1)
  tankCapacity!: number;

  @ApiPropertyOptional({ minimum: 0, nullable: true, example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reserveCapacity?: number;

  @ApiPropertyOptional({ description: 'Base64 encoded image', nullable: true })
  @IsOptional()
  @IsString()
  image?: string;
}
