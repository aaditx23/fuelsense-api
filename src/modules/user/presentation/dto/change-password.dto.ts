import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 100, example: 'NewStrongPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}
