import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeleteUserProfileUseCase } from './application/use-cases/delete-user-profile.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserController } from './presentation/user.controller';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [
    GetUserProfileUseCase,
    DeleteUserProfileUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UserModule {}
