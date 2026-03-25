import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';
import type { AuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { RegisterDto } from '../../presentation/dto/register.dto';
import { AuthUserResponseDto } from '../../presentation/dto/auth-user-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterDto): Promise<UnifiedResponse<AuthUserResponseDto>> {
    const existingUsername = await this.authRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new BadRequestException('Username already exists');
    }

    const existingEmail = await this.authRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.authRepository.createUser({
      username: input.username,
      email: input.email,
      passwordHash,
      role: input.role ?? 'USER',
      profileImage: input.profileImage,
    });

    const token = this.tokenService.sign({
      sub: user.username,
      userId: user.id,
      role: user.role,
      tokenType: user.role === 'ADMIN' ? 'admin_token' : 'user_token',
    });

    return ok({
      message: 'User registered successfully',
      data: AuthUserResponseDto.fromEntity(user),
      token,
    });
  }
}
