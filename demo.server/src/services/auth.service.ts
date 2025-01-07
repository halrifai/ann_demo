import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private jwtService: JwtService,
  ) {}

  public createJWT(user: User): string {
    const payload = {
      username: user.username,
      sub: user._id,
      userId: user.userId,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  async register(
    username: string,
    password: string,
    email: string,
    dateOfBirth: Date,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({
      username,
      password: hashedPassword,
      email,
      dateOfBirth,
    });
    return newUser.save();
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ refresh_token: string; access_token: string }> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.tokenModel.deleteMany({ userId: user.userId }).exec();

    const refreshTokenString = this.createRefreshToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const refreshToken = new this.tokenModel({
      token: refreshTokenString,
      userId: user.userId,
      expiresAt: expiresAt,
    });
    await refreshToken.save();

    return {
      refresh_token: refreshTokenString,
      access_token: this.createJWT(user),
    };
  }

  createRefreshToken(): string {
    const randomBytes = crypto.randomBytes(63);
    const base64Token = randomBytes.toString('base64');
    return base64Token;
  }

  async logout(userId: string): Promise<void> {
    await this.tokenModel.deleteMany({ userId }).exec();
  }

  async verifyAccessToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  async refreshTokens(refreshToken: string) {
    const tokenDoc = await this.tokenModel
      .findOne({ token: refreshToken })
      .exec();

    if (!tokenDoc) {
      throw new UnauthorizedException('invalid refresh token');
    }

    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await this.tokenModel.deleteOne({ token: refreshToken }).exec();
      throw new UnauthorizedException('refresh token expired');
    }

    await this.tokenModel.deleteOne({ token: refreshToken }).exec();

    const user = await this.userModel
      .findOne({ userId: tokenDoc.userId })
      .exec();

    if (!user) {
      throw new UnauthorizedException('U+user not found');
    }

    const newRefreshToken = this.createRefreshToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newRefreshTokenDoc = new this.tokenModel({
      token: newRefreshToken,
      userId: user.userId,
      expiresAt: expiresAt,
    });
    await newRefreshTokenDoc.save();

    return {
      access_token: this.createJWT(user),
      refresh_token: newRefreshToken,
    };
  }

  async cleanupOldTokens() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    try {
      const result = await this.tokenModel
        .deleteMany({
          createdAt: { $lt: twoDaysAgo },
        })
        .exec();

      return {
        message: 'old tokens cleaned up successfully',
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw new Error('could NOT cleanup old tokens');
    }
  }
}
