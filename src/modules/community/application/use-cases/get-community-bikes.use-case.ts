import { Inject, Injectable } from '@nestjs/common';
import { ok, UnifiedResponse } from '../../../../common/api/unified-response';
import { COMMUNITY_REPOSITORY } from '../../domain/repositories/community.repository';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import type { CommunityBikeEntity } from '../../domain/entities/community-bike.entity';

@Injectable()
export class GetCommunityBikesUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
  ) {}

  async execute(search: string, page: number, limit: number): Promise<UnifiedResponse<CommunityBikeEntity>> {
    const bikes = await this.communityRepository.getActiveBikesWithStats({ search, page, limit });
    return ok({ message: 'Community bikes fetched successfully', listData: bikes });
  }
}
