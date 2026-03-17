import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- Auth DTOs ---

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'securePass123' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'guest', enum: ['guest', 'host', 'admin'], default: 'guest' })
  role?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'securePass123' })
  password: string;
}

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() active: boolean;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}

// --- Listing DTOs ---

export class CreateListingDto {
  @ApiProperty({ example: 'Beach House' })
  title: string;

  @ApiProperty({ example: 'Colombo' })
  city: string;

  @ApiPropertyOptional({ example: 'Beautiful ocean-view villa' })
  description?: string;

  @ApiProperty({ example: 150 })
  price: number;
}

export class ListingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() hostId: string;
  @ApiProperty() title: string;
  @ApiProperty() city: string;
  @ApiProperty() description: string;
  @ApiProperty() price: number;
}

export class SearchResponseDto {
  @ApiProperty({ type: [ListingResponseDto] })
  listings: ListingResponseDto[];

  @ApiProperty() total: number;
}

// --- Booking DTOs ---

export class CreateBookingDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  listingId: string;

  @ApiProperty({ example: '2026-04-01' })
  checkIn: string;

  @ApiProperty({ example: '2026-04-05' })
  checkOut: string;

  @ApiProperty({ example: 2 })
  guests: number;
}

export class BookingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() listingId: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() totalPrice: number;
}

export class BookingsListResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  bookings: BookingResponseDto[];
}

// --- Review DTOs ---

export class CreateReviewDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  listingId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  bookingId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Amazing stay! Highly recommend.' })
  comment?: string;
}

export class ReviewItemDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() rating: number;
  @ApiProperty() comment: string;
  @ApiProperty() createdAt: string;
}

export class ReviewsListResponseDto {
  @ApiProperty({ type: [ReviewItemDto] })
  reviews: ReviewItemDto[];
}

// --- Generic DTOs ---

export class GenericResponseDto {
  @ApiProperty() ok: boolean;
  @ApiProperty() message: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' }) status: string;
  @ApiProperty({ example: 'api-gateway' }) service: string;
  @ApiProperty() timestamp: string;
}
