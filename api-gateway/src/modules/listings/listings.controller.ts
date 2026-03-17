import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  OnModuleInit,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateListingDto, ListingResponseDto, SearchResponseDto } from '../../common/dto';

interface RoomsServiceGrpc {
  createListing(data: any): Observable<any>;
  getListing(data: any): Observable<any>;
  searchListings(data: any): Observable<any>;
}

@ApiTags('Listings')
@Controller('listings')
export class ListingsController implements OnModuleInit {
  private roomsService: RoomsServiceGrpc;

  constructor(
    @Inject('ROOMS_SERVICE') private readonly roomsClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.roomsService =
      this.roomsClient.getService<RoomsServiceGrpc>('RoomsService');
  }

  @Get()
  @ApiOperation({ summary: 'Search listings by city, date, and guests' })
  @ApiQuery({ name: 'city', required: false, example: 'Colombo' })
  @ApiQuery({ name: 'checkIn', required: false, example: '2026-04-01' })
  @ApiQuery({ name: 'checkOut', required: false, example: '2026-04-05' })
  @ApiQuery({ name: 'guests', required: false, example: 2 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of matching listings', type: SearchResponseDto })
  async search(
    @Query('city') city?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('guests') guests?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await firstValueFrom(
        this.roomsService.searchListings({
          city: city || '',
          checkIn: checkIn || '',
          checkOut: checkOut || '',
          guests: guests ? parseInt(guests) : 0,
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 10,
        }),
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Search failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing details', type: ListingResponseDto })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getOne(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.roomsService.getListing({ id }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new listing (host only)' })
  @ApiBody({ type: CreateListingDto })
  @ApiResponse({ status: 201, description: 'Listing created', type: ListingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Req() req: any,
    @Body() body: CreateListingDto,
  ) {
    try {
      return await firstValueFrom(
        this.roomsService.createListing({
          hostId: req.user.userId,
          title: body.title,
          city: body.city,
          description: body.description || '',
          price: body.price,
        }),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create listing',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
