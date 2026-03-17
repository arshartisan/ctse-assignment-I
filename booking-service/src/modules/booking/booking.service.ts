import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { firstValueFrom, Observable } from 'rxjs';
import { Reservation, ReservationDocument } from './reservation.schema';

interface UserServiceGrpc {
  getUserById(data: any): Observable<any>;
}

interface RoomsServiceGrpc {
  checkAvailability(data: any): Observable<any>;
  blockDates(data: any): Observable<any>;
  unblockDates(data: any): Observable<any>;
  getListing(data: any): Observable<any>;
}

@Injectable()
export class BookingService implements OnModuleInit {
  private userService: UserServiceGrpc;
  private roomsService: RoomsServiceGrpc;

  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @Inject('USER_SERVICE') private readonly userClient: ClientGrpc,
    @Inject('ROOMS_SERVICE') private readonly roomsClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserServiceGrpc>('UserService');
    this.roomsService =
      this.roomsClient.getService<RoomsServiceGrpc>('RoomsService');
  }

  async createBooking(data: {
    userId: string;
    listingId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) {
    // 1. Validate user exists
    try {
      await firstValueFrom(
        this.userService.getUserById({ id: data.userId }),
      );
    } catch (error) {
      throw new Error('User not found');
    }

    // 2. Get listing details for price
    let listing: any;
    try {
      listing = await firstValueFrom(
        this.roomsService.getListing({ id: data.listingId }),
      );
    } catch (error) {
      throw new Error('Listing not found');
    }

    // 3. Check availability
    const availability = await firstValueFrom(
      this.roomsService.checkAvailability({
        listingId: data.listingId,
        start: data.checkIn,
        end: data.checkOut,
      }),
    );

    if (!availability.available) {
      throw new Error('Listing is not available for the selected dates');
    }

    // 4. Calculate total price (price per night * number of nights)
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = listing.price * nights;

    // 5. Save reservation
    const reservation = new this.reservationModel({
      userId: data.userId,
      listingId: data.listingId,
      hostId: listing.hostId || '',
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      status: 'CONFIRMED',
      totalPrice,
    });
    const saved = await reservation.save();

    // 6. Block dates in rooms-service
    await firstValueFrom(
      this.roomsService.blockDates({
        listingId: data.listingId,
        start: data.checkIn,
        end: data.checkOut,
        reservationId: saved._id.toString(),
      }),
    );

    return this.toBookingResp(saved);
  }

  async cancelBooking(data: { bookingId: string; userId: string }) {
    const reservation = await this.reservationModel.findById(data.bookingId);
    if (!reservation) {
      return { ok: false, message: 'Booking not found' };
    }
    if (reservation.userId !== data.userId) {
      return { ok: false, message: 'Unauthorized' };
    }
    if (reservation.status === 'CANCELLED') {
      return { ok: false, message: 'Booking already cancelled' };
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    // Unblock dates in rooms-service
    await firstValueFrom(
      this.roomsService.unblockDates({
        listingId: reservation.listingId,
        start: reservation.checkIn,
        end: reservation.checkOut,
        reservationId: reservation._id.toString(),
      }),
    );

    return { ok: true, message: 'Booking cancelled successfully' };
  }

  async getBookingsByUser(data: { userId: string }) {
    const reservations = await this.reservationModel
      .find({ userId: data.userId })
      .sort({ createdAt: -1 })
      .exec();

    return {
      bookings: reservations.map((r) => this.toBookingResp(r)),
    };
  }

  async validateBooking(data: { bookingId: string }) {
    const reservation = await this.reservationModel.findById(data.bookingId);
    if (!reservation) {
      return { ok: false, message: 'Booking not found' };
    }
    if (reservation.status !== 'CONFIRMED') {
      return { ok: false, message: 'Booking is not confirmed' };
    }
    return { ok: true, message: 'Booking is valid' };
  }

  private toBookingResp(reservation: ReservationDocument) {
    return {
      id: reservation._id.toString(),
      userId: reservation.userId,
      listingId: reservation.listingId,
      status: reservation.status,
      createdAt: (reservation as any).createdAt?.toISOString() || '',
      totalPrice: reservation.totalPrice,
    };
  }
}
