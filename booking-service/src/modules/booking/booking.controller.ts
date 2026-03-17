import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @GrpcMethod('BookingService', 'CreateBooking')
  async createBooking(data: {
    userId: string;
    listingId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) {
    return this.bookingService.createBooking(data);
  }

  @GrpcMethod('BookingService', 'CancelBooking')
  async cancelBooking(data: { bookingId: string; userId: string }) {
    return this.bookingService.cancelBooking(data);
  }

  @GrpcMethod('BookingService', 'GetBookingsByUser')
  async getBookingsByUser(data: { userId: string }) {
    return this.bookingService.getBookingsByUser(data);
  }

  @GrpcMethod('BookingService', 'ValidateBooking')
  async validateBooking(data: { bookingId: string }) {
    return this.bookingService.validateBooking(data);
  }
}
