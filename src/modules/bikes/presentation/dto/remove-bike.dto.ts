import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveBikeDto {
  @ApiProperty({ minimum: 1, example: 101, description: 'ID of the bike to remove' })
  @IsInt()
  @Min(1)
  bikeId!: number;
}
