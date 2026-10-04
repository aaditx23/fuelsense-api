import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  ENGINE_CLASSES,
  LEADERBOARD_METRICS,
} from '../../domain/services/leaderboard-ranking';
import type {
  EngineClass,
  LeaderboardMetric,
} from '../../domain/services/leaderboard-ranking';

export const MAX_LEADERBOARD_PAGE = 50;
export const DEFAULT_LEADERBOARD_PAGE = 20;

export class LeaderboardQueryDto {
  @ApiProperty({ enum: LEADERBOARD_METRICS, example: 'claim' })
  @IsIn(LEADERBOARD_METRICS)
  metric!: LeaderboardMetric;

  @ApiPropertyOptional({ enum: ['all', '6m'], default: 'all' })
  @IsOptional()
  @IsIn(['all', '6m'])
  period?: 'all' | '6m';

  @ApiPropertyOptional({ enum: ENGINE_CLASSES })
  @IsOptional()
  @IsIn(ENGINE_CLASSES)
  engineClass?: EngineClass;

  @ApiPropertyOptional({ enum: ['PETROL', 'DIESEL', 'OCTANE'] })
  @IsOptional()
  @IsIn(['PETROL', 'DIESEL', 'OCTANE'])
  fuelType?: string;

  @ApiPropertyOptional({ example: 'Yamaha' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_LEADERBOARD_PAGE, default: DEFAULT_LEADERBOARD_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LEADERBOARD_PAGE)
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class LeaderboardPositionQueryDto {
  @ApiProperty({ example: 11 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bikeId!: number;

  @ApiProperty({ enum: LEADERBOARD_METRICS, example: 'claim' })
  @IsIn(LEADERBOARD_METRICS)
  metric!: LeaderboardMetric;

  @ApiPropertyOptional({ enum: ['all', '6m'], default: 'all' })
  @IsOptional()
  @IsIn(['all', '6m'])
  period?: 'all' | '6m';
}
