import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoomsService } from './rooms.service';

@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @GrpcMethod('RoomsService', 'CreateListing')
  async createListing(data: {
    hostId: string;
    title: string;
    city: string;
    description: string;
    price: number;
  }) {
    return this.roomsService.createListing(data);
  }

  @GrpcMethod('RoomsService', 'GetListing')
  async getListing(data: { id: string }) {
    return this.roomsService.getListing(data.id);
  }

  @GrpcMethod('RoomsService', 'SearchListings')
  async searchListings(data: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    page?: number;
    limit?: number;
  }) {
    return this.roomsService.searchListings(data);
  }

  @GrpcMethod('RoomsService', 'CheckAvailability')
  async checkAvailability(data: {
    listingId: string;
    start: string;
    end: string;
  }) {
    return this.roomsService.checkAvailability(data);
  }

  @GrpcMethod('RoomsService', 'BlockDates')
  async blockDates(data: {
    listingId: string;
    start: string;
    end: string;
    reservationId: string;
  }) {
    return this.roomsService.blockDates(data);
  }

  @GrpcMethod('RoomsService', 'UnblockDates')
  async unblockDates(data: {
    listingId: string;
    start: string;
    end: string;
    reservationId: string;
  }) {
    return this.roomsService.unblockDates(data);
  }
}
