import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectBikeDto {
  @ApiProperty({ minimum: 1, example: 101, description: 'ID of the bike to select' })
  @IsInt()
  @Min(1)
  bikeId!: number;
}
