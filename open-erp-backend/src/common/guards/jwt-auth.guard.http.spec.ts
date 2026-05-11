import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('guard-test')
class GuardTestController {
  @Get('protected')
  protectedRoute() {
    return { access: 'granted' };
  }

  @Public()
  @Get('public')
  publicRoute() {
    return { access: 'public' };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [GuardTestController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
class GuardTestModule {}

describe('JwtAuthGuard HTTP runtime', () => {
  const jwtSecret = 'http-runtime-test-secret';
  const originalSecret = process.env.JWT_SECRET;
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    process.env.JWT_SECRET = jwtSecret;
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_PRIVATE_KEY;
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('passes with valid token and fails with expired token via HTTP runtime', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GuardTestModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const validToken = sign(
      { sub: 'user-1', tenantId: 'tenant-1', roles: ['ADMIN'] },
      jwtSecret,
      { expiresIn: '1h' },
    );

    const expiredToken = sign(
      { sub: 'user-1', tenantId: 'tenant-1', roles: ['ADMIN'] },
      jwtSecret,
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/guard-test/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ access: 'granted' });
      });

    await request(app.getHttpServer())
      .get('/guard-test/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'TOKEN_INVALID',
        });
      });

    await request(app.getHttpServer())
      .get('/guard-test/public')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ access: 'public' });
      });

    await app.close();
  });
});
