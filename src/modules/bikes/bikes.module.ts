import { Module } from '@nestjs/common';
import {
  BIKE_REPOSITORY,
  BikeRepository,
} from './domain/repositories/bike.repository';
import { PrismaBikeRepository } from './infrastructure/repositories/prisma-bike.repository';
import { GetActiveBikesUseCase } from './application/use-cases/get-active-bikes.use-case';
import { GetMyBikesUseCase } from './application/use-cases/get-my-bikes.use-case';
import { RemoveMyBikeUseCase } from './application/use-cases/remove-my-bike.use-case';
import { SelectBikeUseCase } from './application/use-cases/select-bike.use-case';
import { SubmitBikeUseCase } from './application/use-cases/submit-bike.use-case';
import { BikesController } from './presentation/bikes.controller';

@Module({
  controllers: [BikesController],
  providers: [
    GetActiveBikesUseCase,
    GetMyBikesUseCase,
    SubmitBikeUseCase,
    SelectBikeUseCase,
    RemoveMyBikeUseCase,
    {
      provide: BIKE_REPOSITORY,
      useClass: PrismaBikeRepository,
    },
  ],
})
export class BikesModule {}
