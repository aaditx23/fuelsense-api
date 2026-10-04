import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { PasswordService } from '../../../auth/application/services/password.service';
import { AUTH_REPOSITORY } from '../../../auth/domain/repositories/auth.repository';
import type { AuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { ChangePasswordDto } from '../../presentation/dto/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(userId: number, input: ChangePasswordDto): Promise<UnifiedResponse<null>> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await this.passwordService.verify(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('New password must differ from the current password');
    }

    const passwordHash = await this.passwordService.hash(input.newPassword);
    await this.userRepository.updatePasswordHash(userId, passwordHash);

    return ok<null>({ message: 'Password changed successfully', data: null });
  }
}
