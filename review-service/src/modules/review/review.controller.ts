import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReviewService } from './review.service';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @GrpcMethod('ReviewService', 'AddReview')
  async addReview(data: {
    userId: string;
    listingId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) {
    return this.reviewService.addReview(data);
  }

  @GrpcMethod('ReviewService', 'GetReviewsByListing')
  async getReviewsByListing(data: { listingId: string }) {
    return this.reviewService.getReviewsByListing(data);
  }
}
