import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApproveBikeUseCase } from './application/use-cases/approve-bike.use-case';
import { DeleteBikeUseCase } from './application/use-cases/delete-bike.use-case';
import { EditBikeUseCase } from './application/use-cases/edit-bike.use-case';
import { GetPendingBikesUseCase } from './application/use-cases/get-pending-bikes.use-case';
import { RejectBikeUseCase } from './application/use-cases/reject-bike.use-case';
import { ADMIN_BIKE_REPOSITORY } from './domain/repositories/admin-bike.repository';
import { PrismaAdminBikeRepository } from './infrastructure/repositories/prisma-admin-bike.repository';
import { AdminController } from './presentation/admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [
    GetPendingBikesUseCase,
    EditBikeUseCase,
    ApproveBikeUseCase,
    RejectBikeUseCase,
    DeleteBikeUseCase,
    {
      provide: ADMIN_BIKE_REPOSITORY,
      useClass: PrismaAdminBikeRepository,
    },
  ],
})
export class AdminModule {}
