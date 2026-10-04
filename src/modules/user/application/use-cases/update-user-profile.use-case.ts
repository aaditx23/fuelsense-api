import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { AUTH_REPOSITORY } from '../../../auth/domain/repositories/auth.repository';
import type { AuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateProfileDto } from '../../presentation/dto/update-profile.dto';
import { UserProfileResponseDto } from '../../presentation/dto/user-profile-response.dto';

/** Changes the caller's own username, email and/or profile picture. */
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(
    userId: number,
    input: UpdateProfileDto,
  ): Promise<UnifiedResponse<UserProfileResponseDto>> {
    const hasChange = Object.values(input).some((value) => value !== undefined);
    if (!hasChange) {
      throw new BadRequestException('At least one field to update is required');
    }

    const current = await this.authRepository.findById(userId);
    if (!current) {
      throw new NotFoundException('User not found');
    }

    const username = input.username?.trim();
    const email = input.email?.trim();

    if (username !== undefined && username !== current.username) {
      const taken = await this.authRepository.findByUsername(username);
      if (taken && taken.id !== userId) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email !== undefined && email !== current.email) {
      const taken = await this.authRepository.findByEmail(email);
      if (taken && taken.id !== userId) {
        throw new ConflictException('Email already exists');
      }
    }

    await this.userRepository.updateProfile(userId, {
      username,
      email,
      profileImage: input.profileImage,
    });

    const profile = await this.userRepository.findProfileById(userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return ok({
      message: 'Profile updated successfully',
      data: UserProfileResponseDto.fromEntity(profile),
    });
  }
}
