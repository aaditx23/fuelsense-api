import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: number): Promise<UnifiedResponse<null>> {
    const profile = await this.userRepository.findProfileById(userId);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deleteById(userId);

    return ok<null>({
      message: 'User profile deleted permanently',
      data: null,
    });
  }
}
