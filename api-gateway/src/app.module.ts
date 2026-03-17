import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { join } from 'path';
import { AuthGatewayModule } from './modules/auth/auth.module';
import { ListingsGatewayModule } from './modules/listings/listings.module';
import { BookingsGatewayModule } from './modules/bookings/bookings.module';
import { ReviewsGatewayModule } from './modules/reviews/reviews.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'staylike-jwt-secret',
      signOptions: { expiresIn: '15m' },
    }),
    AuthGatewayModule,
    ListingsGatewayModule,
    BookingsGatewayModule,
    ReviewsGatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
