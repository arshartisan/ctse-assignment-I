import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }) {
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const user = new this.userModel({
      email: data.email,
      password: data.passwordHash,
      name: data.name,
      role: data.role || 'guest',
    });
    const saved = await user.save();
    return this.toUserResp(saved);
  }

  async getUserByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('User not found');
    }
    return this.toUserResp(user);
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.toUserResp(user);
  }

  async validateUserRole(id: string, role: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      return { ok: false, message: 'User not found' };
    }
    if (user.role !== role) {
      return { ok: false, message: `User role is ${user.role}, not ${role}` };
    }
    return { ok: true, message: 'Role validated' };
  }

  private toUserResp(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
    };
  }
}
