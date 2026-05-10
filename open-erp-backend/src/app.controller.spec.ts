import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health/health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('health', () => {
    it('should return gateway status payload', () => {
      const result = healthController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('api-gateway');
      expect(result.dependencies).toBeDefined();
    });
  });
});
