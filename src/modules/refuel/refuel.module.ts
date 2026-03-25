import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateRefuelRecordUseCase } from './application/use-cases/create-refuel-record.use-case';
import { GetRefuelRecordsUseCase } from './application/use-cases/get-refuel-records.use-case';
import { REFUEL_REPOSITORY } from './domain/repositories/refuel.repository';
import { PrismaRefuelRepository } from './infrastructure/repositories/prisma-refuel.repository';
import { RefuelController } from './presentation/refuel.controller';

@Module({
  imports: [AuthModule],
  controllers: [RefuelController],
  providers: [
    CreateRefuelRecordUseCase,
    GetRefuelRecordsUseCase,
    {
      provide: REFUEL_REPOSITORY,
      useClass: PrismaRefuelRepository,
    },
  ],
})
export class RefuelModule {}
