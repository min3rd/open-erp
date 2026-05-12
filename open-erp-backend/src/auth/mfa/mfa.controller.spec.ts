import { Test, TestingModule } from '@nestjs/testing';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { SetupMfaDto, VerifyMfaDto } from './dto';

describe('MfaController', () => {
  let controller: MfaController;
  let service: MfaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaController],
      providers: [MfaService],
    }).compile();

    controller = module.get<MfaController>(MfaController);
    service = module.get<MfaService>(MfaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should setup MFA', async () => {
    const setupMfaDto: SetupMfaDto = { userId: '123' };
    jest.spyOn(service, 'setupMfa').mockImplementation(() => 'MFA setup successful');

    expect(await controller.setupMfa(setupMfaDto)).toBe('MFA setup successful');
  });

  it('should verify MFA', async () => {
    const verifyMfaDto: VerifyMfaDto = { userId: '123', code: '123456' };
    jest.spyOn(service, 'verifyMfa').mockImplementation(() => true);

    expect(await controller.verifyMfa(verifyMfaDto)).toBe(true);
  });
});