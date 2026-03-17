import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { firstValueFrom, Observable } from 'rxjs';
import { Review, ReviewDocument } from './review.schema';

interface BookingServiceGrpc {
  validateBooking(data: any): Observable<any>;
}

@Injectable()
export class ReviewService implements OnModuleInit {
  private bookingService: BookingServiceGrpc;

  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.bookingService =
      this.bookingClient.getService<BookingServiceGrpc>('BookingService');
  }

  async addReview(data: {
    userId: string;
    listingId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) {
    // Validate booking exists and is confirmed
    const bookingValidation = await firstValueFrom(
      this.bookingService.validateBooking({ bookingId: data.bookingId }),
    );

    if (!bookingValidation.ok) {
      return {
        ok: false,
        message: bookingValidation.message || 'Invalid booking',
      };
    }

    // Check for duplicate review
    const existing = await this.reviewModel.findOne({
      bookingId: data.bookingId,
      userId: data.userId,
    });
    if (existing) {
      return { ok: false, message: 'Review already submitted for this booking' };
    }

    const review = new this.reviewModel(data);
    await review.save();

    return { ok: true, message: 'Review added successfully' };
  }

  async getReviewsByListing(data: { listingId: string }) {
    const reviews = await this.reviewModel
      .find({ listingId: data.listingId })
      .sort({ createdAt: -1 })
      .exec();

    return {
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        userId: r.userId,
        rating: r.rating,
        comment: r.comment,
        createdAt: (r as any).createdAt?.toISOString() || '',
      })),
    };
  }
}
