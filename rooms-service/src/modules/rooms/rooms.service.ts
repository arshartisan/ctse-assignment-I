import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument } from './listing.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  async createListing(data: {
    hostId: string;
    title: string;
    city: string;
    description: string;
    price: number;
  }) {
    const listing = new this.listingModel(data);
    const saved = await listing.save();
    return this.toListingResp(saved);
  }

  async getListing(id: string) {
    const listing = await this.listingModel.findById(id);
    if (!listing) {
      throw new Error('Listing not found');
    }
    return this.toListingResp(listing);
  }

  async searchListings(data: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    page?: number;
    limit?: number;
  }) {
    const { city, checkIn, checkOut, page = 1, limit = 10 } = data;

    const filter: any = { active: true };
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    // If date range provided, exclude listings with overlapping blocked dates
    if (checkIn && checkOut) {
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      filter.blockedDates = {
        $not: {
          $elemMatch: {
            start: { $lt: endDate },
            end: { $gt: startDate },
          },
        },
      };
    }

    const skip = (page - 1) * limit;
    const [listings, total] = await Promise.all([
      this.listingModel.find(filter).skip(skip).limit(limit).exec(),
      this.listingModel.countDocuments(filter),
    ]);

    return {
      listings: listings.map((l) => this.toListingResp(l)),
      total,
    };
  }

  async checkAvailability(data: {
    listingId: string;
    start: string;
    end: string;
  }) {
    const listing = await this.listingModel.findById(data.listingId);
    if (!listing) {
      return { available: false };
    }

    const startDate = new Date(data.start);
    const endDate = new Date(data.end);

    const hasConflict = listing.blockedDates.some((blocked) => {
      const bStart = new Date(blocked.start);
      const bEnd = new Date(blocked.end);
      return bStart < endDate && bEnd > startDate;
    });

    return { available: !hasConflict };
  }

  async blockDates(data: {
    listingId: string;
    start: string;
    end: string;
    reservationId: string;
  }) {
    const result = await this.listingModel.findByIdAndUpdate(
      data.listingId,
      {
        $push: {
          blockedDates: {
            start: new Date(data.start),
            end: new Date(data.end),
            reservationId: data.reservationId,
          },
        },
      },
      { new: true },
    );

    if (!result) {
      return { ok: false, message: 'Listing not found' };
    }
    return { ok: true, message: 'Dates blocked successfully' };
  }

  async unblockDates(data: {
    listingId: string;
    start: string;
    end: string;
    reservationId: string;
  }) {
    const result = await this.listingModel.findByIdAndUpdate(
      data.listingId,
      {
        $pull: {
          blockedDates: { reservationId: data.reservationId },
        },
      },
      { new: true },
    );

    if (!result) {
      return { ok: false, message: 'Listing not found' };
    }
    return { ok: true, message: 'Dates unblocked successfully' };
  }

  private toListingResp(listing: ListingDocument) {
    return {
      id: listing._id.toString(),
      hostId: listing.hostId,
      title: listing.title,
      city: listing.city,
      description: listing.description || '',
      price: listing.price,
    };
  }
}
