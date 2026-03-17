import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Reservation, ReservationSchema } from './reservation.schema';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'staylike.user',
          protoPath: join(
            __dirname,
            '../../../../../common/protos/user.proto',
          ),
          url: `${process.env.USER_SERVICE_HOST || 'localhost'}:${process.env.USER_SERVICE_PORT || '50051'}`,
        },
      },
      {
        name: 'ROOMS_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'staylike.rooms',
          protoPath: join(
            __dirname,
            '../../../../../common/protos/rooms.proto',
          ),
          url: `${process.env.ROOMS_SERVICE_HOST || 'localhost'}:${process.env.ROOMS_SERVICE_PORT || '50052'}`,
        },
      },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
