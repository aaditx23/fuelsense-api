import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ minimum: 1, example: 45, description: 'User bike ID (mandatory)' })
  @IsInt()
  @Min(1)
  userBikeId!: number;

  @ApiProperty({ minimum: 0, example: 12345.6 })
  @IsNumber()
  @Min(0)
  odometerReading!: number;

  @ApiProperty({ example: 'ENGINE_OIL', description: 'Category (ENGINE_OIL, CHAIN_SPROCKET, BRAKE_PADS, etc.)' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({ example: 'Changed engine oil' })
  @IsOptional()
  @IsString()
  description?: string;

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

  @ApiPropertyOptional({ example: 'Motul' })
  @IsOptional()
  @IsString()
  partsBrand?: string;

  @ApiPropertyOptional({ example: '2026-06-19T17:14:00.000Z' })
  @IsOptional()
  @IsString()
  serviceDate?: string;
}
