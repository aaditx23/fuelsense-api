import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UserProfileResponseDto } from '../../presentation/dto/user-profile-response.dto';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: number): Promise<UnifiedResponse<UserProfileResponseDto>> {
    const profile = await this.userRepository.findProfileById(userId);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return ok({
      message: 'User profile fetched successfully',
      data: UserProfileResponseDto.fromEntity(profile),
    });
  }
}
