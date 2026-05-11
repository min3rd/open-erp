import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { HealthDependencyProbeService } from './health/health-dependency-probe.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return hello message', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });

    it('appService.getHello returns same value', () => {
      const result = appService.getHello();
      expect(result).toBe('Hello World!');
    });
  });
});

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthDependencyProbeService,
          useValue: {
            probeAll: jest.fn().mockResolvedValue({
              redis: 'not-configured',
              authService: 'not-configured',
              tenantService: 'not-configured',
            }),
          },
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('health', () => {
    it('should return gateway status payload', async () => {
      const result = await healthController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('api-gateway');
      expect(result.dependencies).toBeDefined();
    });
  });
});
