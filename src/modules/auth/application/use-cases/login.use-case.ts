import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';
import type { AuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { LoginDto } from '../../presentation/dto/login.dto';
import { AuthUserResponseDto } from '../../presentation/dto/auth-user-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginDto): Promise<UnifiedResponse<AuthUserResponseDto>> {
    const user = await this.authRepository.findByUsernameOrEmail(input.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.passwordService.verify(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.tokenService.sign({
      sub: user.username,
      userId: user.id,
      role: user.role,
      tokenType: user.role === 'ADMIN' ? 'admin_token' : 'user_token',
    });

    return ok({
      message: 'Login successful',
      data: AuthUserResponseDto.fromEntity(user),
      token,
    });
  }
}
