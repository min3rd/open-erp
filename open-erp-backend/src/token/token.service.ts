import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from './schemas/password-reset-token.schema';

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetTokenDocument>,
  ) {}

  async createRefreshToken(params: {
    tenantId: string;
    userId: string;
    deviceInfo?: Record<string, unknown>;
  }): Promise<{ refreshToken: string; expiresAt: Date }> {
    const refreshToken = uuidv4();
    const tokenHash = this.sha256(refreshToken);
    const expiresDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_DAYS') ?? '7',
    );
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      userId: new Types.ObjectId(params.userId),
      tokenHash,
      expiresAt,
      isRevoked: false,
      deviceInfo: params.deviceInfo,
    });

    return { refreshToken, expiresAt };
  }

  async validateRefreshToken(
    rawRefreshToken: string,
  ): Promise<RefreshTokenDocument> {
    const tokenHash = this.sha256(rawRefreshToken);
    const tokenDoc = await this.refreshTokenModel.findOne({ tokenHash }).exec();

    if (!tokenDoc || tokenDoc.isRevoked || tokenDoc.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Refresh token is invalid or expired',
      });
    }

    return tokenDoc;
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    deviceInfo?: Record<string, unknown>,
  ): Promise<{
    refreshToken: string;
    tenantId: string;
    userId: string;
    expiresAt: Date;
  }> {
    const tokenDoc = await this.validateRefreshToken(rawRefreshToken);

    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const nextToken = await this.createRefreshToken({
      tenantId: tokenDoc.tenantId.toString(),
      userId: tokenDoc.userId.toString(),
      deviceInfo,
    });

    return {
      refreshToken: nextToken.refreshToken,
      expiresAt: nextToken.expiresAt,
      tenantId: tokenDoc.tenantId.toString(),
      userId: tokenDoc.userId.toString(),
    };
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.sha256(rawRefreshToken);
    await this.refreshTokenModel
      .updateOne({ tokenHash }, { $set: { isRevoked: true } })
      .exec();
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRevoked: false },
        { $set: { isRevoked: true } },
      )
      .exec();
  }

  async createPasswordResetOtp(params: {
    tenantId: string;
    userId: string;
  }): Promise<{ otp: string; expiresAt: Date }> {
    const otp = String(randomInt(100000, 1000000));
    const otpHash = this.sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.passwordResetTokenModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      userId: new Types.ObjectId(params.userId),
      otpHash,
      expiresAt,
      isUsed: false,
    });

    return { otp, expiresAt };
  }

  async consumePasswordResetOtp(
    tenantId: string,
    userId: string,
    otp: string,
  ): Promise<'valid' | 'expired' | 'invalid'> {
    const otpHash = this.sha256(otp);
    const now = new Date();
    const tenantObjectId = new Types.ObjectId(tenantId);
    const userObjectId = new Types.ObjectId(userId);

    const result = await this.passwordResetTokenModel
      .findOneAndUpdate(
        {
          tenantId: tenantObjectId,
          userId: userObjectId,
          otpHash,
          isUsed: false,
          expiresAt: { $gt: now },
        },
        {
          $set: { isUsed: true },
        },
      )
      .exec();

    if (result) {
      return 'valid';
    }

    const expired = await this.passwordResetTokenModel
      .findOne({
        tenantId: tenantObjectId,
        userId: userObjectId,
        otpHash,
        isUsed: false,
        expiresAt: { $lte: now },
      })
      .select('_id')
      .lean()
      .exec();

    if (expired) {
      return 'expired';
    }

    return 'invalid';
  }

  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
}
