import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('check-subdomain')
  async checkSubdomain(@Query('subdomain') subdomain: string) {
    const available = await this.authService.checkSubdomain(subdomain);
    return {
      success: true,
      data: { available },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const tenantId = req.tenantId;
    const result = await this.authService.login(dto, tenantId);

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        tenant: result.data.tenant,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const cookiesHeader = req.headers.cookie || '';
    const cookies = cookiesHeader.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        acc[parts[0]] = parts.slice(1).join('=');
      }
      return acc;
    }, {});

    const refreshToken =
      cookies['refreshToken'] ||
      req.headers['x-refresh-token'] ||
      req.body?.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          messageKey: 'auth.refresh_token_required',
        },
      });
    }

    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const cookiesHeader = req.headers.cookie || '';
    const cookies = cookiesHeader.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        acc[parts[0]] = parts.slice(1).join('=');
      }
      return acc;
    }, {});

    const refreshToken =
      cookies['refreshToken'] ||
      req.headers['x-refresh-token'] ||
      req.body?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
    };
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body('token') token: string) {
    const result = await this.authService.activate(token);
    return {
      success: true,
      messageKey: 'auth.activation_success',
      data: {
        subdomain: result.subdomain,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.authService.me(req.user.userId);
  }

  @Get('menu')
  @UseGuards(JwtAuthGuard)
  async menu(@Req() req: any) {
    return this.authService.menu(req.user.userId);
  }
}
