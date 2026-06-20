import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../shared/infrastructure/prisma/prisma.module';
import { GetCommunityBikesUseCase } from './application/use-cases/get-community-bikes.use-case';
import { GetBikeCommunityProfileUseCase } from './application/use-cases/get-bike-community-profile.use-case';
import { COMMUNITY_REPOSITORY } from './domain/repositories/community.repository';
import { PrismaCommunityRepository } from './infrastructure/repositories/prisma-community.repository';
import { CommunityController } from './presentation/community.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CommunityController],
  providers: [
    GetCommunityBikesUseCase,
    GetBikeCommunityProfileUseCase,
    {
      provide: COMMUNITY_REPOSITORY,
      useClass: PrismaCommunityRepository,
    },
  ],
})
export class CommunityModule {}
