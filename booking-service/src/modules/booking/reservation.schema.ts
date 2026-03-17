import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  listingId: string;

  @Prop({ default: '' })
  hostId: string;

  @Prop({ required: true })
  checkIn: string; // YYYY-MM-DD

  @Prop({ required: true })
  checkOut: string; // YYYY-MM-DD

  @Prop({ default: 1 })
  guests: number;

  @Prop({ default: 'CONFIRMED' })
  status: string;

  @Prop({ default: 0 })
  totalPrice: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
