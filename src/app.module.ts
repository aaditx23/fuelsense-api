import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BikesModule } from './modules/bikes/bikes.module';
import { FuelPricesModule } from './modules/fuel-prices/fuel-prices.module';
import { RefuelModule } from './modules/refuel/refuel.module';
import { PrismaModule } from './modules/shared/infrastructure/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    BikesModule,
    RefuelModule,
    AdminModule,
    FuelPricesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
