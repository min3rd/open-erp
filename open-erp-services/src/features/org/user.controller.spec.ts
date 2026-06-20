import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    invite: jest.fn(),
    findAll: jest.fn(),
    resendInvite: jest.fn(),
    cancelInvite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: { verify: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('invite', () => {
    it('should call userService.invite and return result', async () => {
      const dto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const req = { tenantId: 'tenant-1' };
      const expectedResult = { success: true, data: { id: 'user-1' } };

      mockUserService.invite.mockResolvedValue(expectedResult);

      const result = await controller.invite(dto, req);
      expect(result).toBe(expectedResult);
      expect(mockUserService.invite).toHaveBeenCalledWith(dto, req.tenantId);
    });
  });

  describe('findAll', () => {
    it('should call userService.findAll and return wrapper', async () => {
      const req = { tenantId: 'tenant-1' };
      const mockUsers = [{ id: 'user-1', email: 'test@example.com' }];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll(req);
      expect(result).toEqual({ success: true, data: mockUsers });
      expect(mockUserService.findAll).toHaveBeenCalledWith(req.tenantId);
    });
  });

  describe('resendInvite', () => {
    it('should call userService.resendInvite and return result', async () => {
      const req = { tenantId: 'tenant-1' };
      const userId = 'user-1';
      const expectedResult = { success: true };

      mockUserService.resendInvite.mockResolvedValue(expectedResult);

      const result = await controller.resendInvite(userId, req);
      expect(result).toBe(expectedResult);
      expect(mockUserService.resendInvite).toHaveBeenCalledWith(userId, req.tenantId);
    });
  });

  describe('cancelInvite', () => {
    it('should call userService.cancelInvite and return wrapper', async () => {
      const req = { tenantId: 'tenant-1' };
      const userId = 'user-1';

      mockUserService.cancelInvite.mockResolvedValue(undefined);

      const result = await controller.cancelInvite(userId, req);
      expect(result).toEqual({ success: true });
      expect(mockUserService.cancelInvite).toHaveBeenCalledWith(userId, req.tenantId);
    });
  });
});
