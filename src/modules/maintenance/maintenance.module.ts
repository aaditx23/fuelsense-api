import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateMaintenanceLogUseCase } from './application/use-cases/create-maintenance-log.use-case';
import { GetMaintenanceLogsUseCase } from './application/use-cases/get-maintenance-logs.use-case';
import { GetBikeAnalyticsUseCase } from './application/use-cases/get-bike-analytics.use-case';
import { GetRegisteredPartsUseCase } from './application/use-cases/get-registered-parts.use-case';
import { MAINTENANCE_REPOSITORY } from './domain/repositories/maintenance.repository';
import { PrismaMaintenanceRepository } from './infrastructure/repositories/prisma-maintenance.repository';
import { MaintenanceController } from './presentation/maintenance.controller';

@Module({
  imports: [AuthModule],
  controllers: [MaintenanceController],
  providers: [
    CreateMaintenanceLogUseCase,
    GetMaintenanceLogsUseCase,
    GetBikeAnalyticsUseCase,
    GetRegisteredPartsUseCase,
    {
      provide: MAINTENANCE_REPOSITORY,
      useClass: PrismaMaintenanceRepository,
    },
  ],
})
export class MaintenanceModule {}
