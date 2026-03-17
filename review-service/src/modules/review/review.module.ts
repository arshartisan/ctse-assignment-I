import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Review, ReviewSchema } from './review.schema';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ClientsModule.register([
      {
        name: 'BOOKING_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'staylike.booking',
          protoPath: join(
            __dirname,
            '../../../../../common/protos/booking.proto',
          ),
          url: `${process.env.BOOKING_SERVICE_HOST || 'localhost'}:${process.env.BOOKING_SERVICE_PORT || '50053'}`,
        },
      },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
