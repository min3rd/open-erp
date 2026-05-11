import { HealthController } from './health.controller';
import { HealthDependencyProbeService } from './health-dependency-probe.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    const probeService = {
      probeAll: jest.fn().mockResolvedValue({
        redis: 'ok',
        authService: 'unreachable',
        tenantService: 'not-configured',
      }),
    } as unknown as HealthDependencyProbeService;

    controller = new HealthController(probeService);
  });

  it('returns dependency status from probe service', async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api-gateway');
    expect(result.dependencies).toBeDefined();
  });

  describe('getHealth with dependencies', () => {
    it('should include uptime in response', async () => {
      const result = await controller.getHealth();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return all required fields', async () => {
      const result = await controller.getHealth();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('dependencies');
    });

    it('should have api-gateway service name', async () => {
      const result = await controller.getHealth();
      expect(result.service).toBe('api-gateway');
    });

    it('should return healthy status', async () => {
      const result = await controller.getHealth();
      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('dependencies');
    });
  });
});
