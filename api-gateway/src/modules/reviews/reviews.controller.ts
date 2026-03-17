import {
  Controller,
  Get,
  Post,
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
import { CreateReviewDto, ReviewsListResponseDto, GenericResponseDto } from '../../common/dto';

interface ReviewServiceGrpc {
  addReview(data: any): Observable<any>;
  getReviewsByListing(data: any): Observable<any>;
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController implements OnModuleInit {
  private reviewService: ReviewServiceGrpc;

  constructor(
    @Inject('REVIEW_SERVICE') private readonly reviewClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.reviewService =
      this.reviewClient.getService<ReviewServiceGrpc>('ReviewService');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Submit a review for a booking' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review submitted', type: GenericResponseDto })
  @ApiResponse({ status: 400, description: 'Review failed (invalid booking, duplicate, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addReview(
    @Req() req: any,
    @Body() body: CreateReviewDto,
  ) {
    try {
      return await firstValueFrom(
        this.reviewService.addReview({
          userId: req.user.userId,
          listingId: body.listingId,
          bookingId: body.bookingId,
          rating: body.rating,
          comment: body.comment || '',
        }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add review',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Get all reviews for a listing' })
  @ApiResponse({ status: 200, description: 'List of reviews', type: ReviewsListResponseDto })
  async getByListing(@Param('listingId') listingId: string) {
    try {
      return await firstValueFrom(
        this.reviewService.getReviewsByListing({ listingId }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch reviews',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
