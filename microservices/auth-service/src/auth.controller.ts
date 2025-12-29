import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';

export class LoginDto {
  username: string;
  password: string;
}

export class RegisterDto {
  username: string;
  password: string;
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly metricsService: MetricsService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.metricsService.incrementCounter('auth_login_attempts_total');
    this.loggerService.log('Login attempt', { username: loginDto.username });
    
    const result = await this.authService.login(loginDto);
    
    this.metricsService.incrementCounter('auth_login_success_total');
    return result;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.metricsService.incrementCounter('auth_register_attempts_total');
    this.loggerService.log('Register attempt', { username: registerDto.username });
    
    const result = await this.authService.register(registerDto);
    
    this.metricsService.incrementCounter('auth_register_success_total');
    return result;
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
    };
  }

  @Get('metrics')
  async metrics() {
    return this.metricsService.getMetrics();
  }
}
