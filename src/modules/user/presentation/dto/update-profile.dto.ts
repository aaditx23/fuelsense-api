import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Body of `PATCH /user/me`. Only the fields sent change; `profileImage`
 * accepts `null` to remove the picture.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 50, example: 'amirdev' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'amir@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded profile image; null removes it', nullable: true })
  @IsOptional()
  @IsString()
  profileImage?: string | null;
}
