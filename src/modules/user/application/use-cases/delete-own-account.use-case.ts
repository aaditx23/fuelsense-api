import {
  BadRequestException,
  ConflictException,
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

/**
 * Permanently deletes the caller's account after a password check. Garage,
 * refuel and maintenance rows go with it (cascade); bikes the user proposed
 * stay in the catalog with the submitter cleared.
 */
@Injectable()
export class DeleteOwnAccountUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(userId: number, password: string): Promise<UnifiedResponse<null>> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await this.passwordService.verify(password, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Password is incorrect');
    }

    if (user.role === 'ADMIN' && (await this.userRepository.countAdmins()) <= 1) {
      throw new ConflictException('The last admin account cannot be deleted');
    }

    await this.userRepository.deleteById(userId);

    return ok<null>({ message: 'Account deleted permanently', data: null });
  }
}
