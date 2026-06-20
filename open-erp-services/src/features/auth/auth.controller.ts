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
import { RegisterUserDto } from './dto/register-user.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/user')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
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

    if (result.success && result.data && result.data.refreshToken) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    return result;
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
  async activate(
    @Body('token') token: string,
    @Body('password') password?: string,
  ) {
    const result = await this.authService.activate(token, password);
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
    return this.authService.me(req.user.userId, req.user.tenantId);
  }

  @Get('menu')
  @UseGuards(JwtAuthGuard)
  async menu(@Req() req: any) {
    return this.authService.menu(req.user.userId, req.user.tenantId);
  }

  @Post('select-tenant')
  @HttpCode(HttpStatus.OK)
  async selectTenant(
    @Body() dto: SelectTenantDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.selectTenant(dto);

    if (result.success && result.data && result.data.refreshToken) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    return result;
  }

  @Post('test-link-tenant')
  @HttpCode(HttpStatus.OK)
  async testLinkTenant(@Body() body: { email: string; subdomain: string }) {
    return this.authService.testLinkTenant(body.email, body.subdomain);
  }
}
