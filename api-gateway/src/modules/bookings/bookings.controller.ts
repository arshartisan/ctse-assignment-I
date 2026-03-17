import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  OnModuleInit,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateBookingDto, BookingResponseDto, BookingsListResponseDto, GenericResponseDto } from '../../common/dto';

interface BookingServiceGrpc {
  createBooking(data: any): Observable<any>;
  cancelBooking(data: any): Observable<any>;
  getBookingsByUser(data: any): Observable<any>;
}

@ApiTags('Bookings')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController implements OnModuleInit {
  private bookingService: BookingServiceGrpc;

  constructor(
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.bookingService =
      this.bookingClient.getService<BookingServiceGrpc>('BookingService');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created', type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Booking failed (unavailable dates, invalid listing, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Req() req: any,
    @Body() body: CreateBookingDto,
  ) {
    try {
      return await firstValueFrom(
        this.bookingService.createBooking({
          userId: req.user.userId,
          listingId: body.listingId,
          checkIn: body.checkIn,
          checkOut: body.checkOut,
          guests: body.guests,
        }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Booking failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user bookings', type: BookingsListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any) {
    try {
      return await firstValueFrom(
        this.bookingService.getBookingsByUser({
          userId: req.user.userId,
        }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch bookings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled', type: GenericResponseDto })
  @ApiResponse({ status: 400, description: 'Cancellation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.bookingService.cancelBooking({
          bookingId: id,
          userId: req.user.userId,
        }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Cancellation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
