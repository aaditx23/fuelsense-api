import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Username or email', example: 'amirdev' })
  @IsString()
  username!: string;

  @ApiProperty({ minLength: 8, format: 'password', example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
