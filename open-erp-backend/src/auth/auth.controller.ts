import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth-runtime.config';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestUser } from './interfaces/request-user.interface';
import { ChallengeMfaDto } from './mfa/dto/challenge-mfa.dto';
import { DisableMfaDto } from './mfa/dto/disable-mfa.dto';
import { VerifyMfaDto } from './mfa/dto/verify-mfa.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.login(dto, { ip, userAgent });
    const loginData = result.data as {
      refreshToken?: string;
      refreshTokenExpiresAt?: Date | string;
    };
    this.attachRefreshTokenCookie(
      res,
      loginData.refreshToken,
      loginData.refreshTokenExpiresAt,
    );
    return result;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body('refreshToken') refreshToken?: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) res?: Response,
  ) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    const resolvedRefreshToken =
      this.extractRefreshTokenFromCookie(req) ?? refreshToken?.trim();

    const result = await this.authService.logout(user, {
      refreshToken: resolvedRefreshToken,
      ip: ip ?? 'unknown',
      userAgent,
    });

    this.clearRefreshTokenCookie(res);
    return result;
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) res?: Response,
  ) {
    const refreshToken = this.resolveRefreshToken(req, dto);
    const result = await this.authService.refreshToken(refreshToken, {
      ip,
      userAgent,
    });

    this.attachRefreshTokenCookie(
      res,
      result.data.refreshToken,
      result.data.refreshTokenExpiresAt,
    );
    return result;
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent = 'unknown',
  ) {
    return this.authService.forgotPassword(dto, { ip, userAgent });
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.me(user);
  }

  @Post('mfa/setup')
  async setupMfa(@Req() req: Request) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.setupMfa(user);
  }

  @Post('mfa/verify')
  async verifyMfa(@Req() req: Request, @Body() dto: VerifyMfaDto) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.verifyMfa(user, dto.code);
  }

  @Post('mfa/disable')
  async disableMfa(@Req() req: Request, @Body() dto: DisableMfaDto) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.disableMfa(user, dto.code);
  }

  @Get('mfa/backup-codes')
  async backupCodes(@Req() req: Request) {
    const user = req.user as RequestUser | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.regenerateBackupCodes(user);
  }

  @Public()
  @Post('mfa/challenge')
  async challengeMfa(@Body() dto: ChallengeMfaDto) {
    return this.authService.challengeMfa(dto.mfaToken, dto.code, dto.backupCode);
  }

  private resolveRefreshToken(req: Request, dto: RefreshTokenDto): string {
    const cookieRefreshToken = this.extractRefreshTokenFromCookie(req);
    if (cookieRefreshToken) {
      return cookieRefreshToken;
    }

    if (dto.refreshToken?.trim()) {
      return dto.refreshToken.trim();
    }

    throw new UnauthorizedException({
      code: 'UNAUTHORIZED',
      message: 'Missing refresh token',
    });
  }

  private extractRefreshTokenFromCookie(req: Request): string | undefined {
    const cookieHeader = req.header('cookie');
    if (!cookieHeader) {
      return undefined;
    }

    for (const rawCookie of cookieHeader.split(';')) {
      const [name, ...valueParts] = rawCookie.trim().split('=');
      if (name === REFRESH_TOKEN_COOKIE_NAME && valueParts.length > 0) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return undefined;
  }

  private attachRefreshTokenCookie(
    res: Response | undefined,
    refreshToken: string | undefined,
    expiresAt: Date | string | undefined,
  ): void {
    if (!res || !refreshToken) {
      return;
    }

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      this.buildRefreshTokenCookieOptions(expiresAt),
    );
  }

  private clearRefreshTokenCookie(res: Response | undefined): void {
    if (!res) {
      return;
    }

    res.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.buildRefreshTokenCookieOptions(undefined),
    );
  }

  private buildRefreshTokenCookieOptions(
    expiresAt: Date | string | undefined,
  ): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
      expires: expiresAt ? new Date(expiresAt) : undefined,
    };
  }
}
