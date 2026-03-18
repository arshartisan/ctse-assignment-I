import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(data: {
    type?: NotificationType;
    userId: string;
    title: string;
    message: string;
  }) {
    const notification = new this.notificationModel({
      type: data.type || NotificationType.PRIVATE,
      userId: data.userId,
      title: data.title,
      message: data.message,
      is_read: false,
    });
    return notification.save();
  }

  async getUserNotifications(data: { userId: string }) {
    const notifications = await this.notificationModel
      .find({ userId: data.userId })
      .sort({ createdAt: -1 })
      .exec();

    return {
      notifications: notifications.map((n) => this.toProtoItem(n)),
    };
  }

  async markNotificationsRead(data: { notificationIds: string[]; userId: string }) {
    await this.notificationModel.updateMany(
      { _id: { $in: data.notificationIds }, userId: data.userId },
      { $set: { is_read: true } },
    );
    return { ok: true, message: 'Notifications marked as read' };
  }

  async deleteNotifications(data: { notificationIds: string[]; userId: string }) {
    await this.notificationModel.deleteMany({
      _id: { $in: data.notificationIds },
      userId: data.userId,
    });
    return { ok: true, message: 'Notifications deleted' };
  }

  private toProtoItem(n: NotificationDocument) {
    return {
      id: (n as any)._id.toString(),
      type: n.type,
      userId: n.userId,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      createdAt: (n as any).createdAt?.toISOString() || '',
      updatedAt: (n as any).updatedAt?.toISOString() || '',
    };
  }
}
