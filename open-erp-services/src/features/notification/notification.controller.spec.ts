import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../../core/notification/notification.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let serviceMock: any;

  const mockNotificationService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    serviceMock = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return paginated user notifications', async () => {
      const req = { tenantId: 't1', user: { userId: 'usr-1' } };
      const query = { page: 1, limit: 10 };
      const mockResult = { items: [], meta: { totalItems: 0, totalPages: 0 } };
      serviceMock.getNotifications.mockResolvedValue(mockResult);

      const response = await controller.getNotifications(query, req);

      expect(serviceMock.getNotifications).toHaveBeenCalledWith('t1', 'usr-1', query);
      expect(response).toEqual({
        success: true,
        data: mockResult,
      });
    });
  });

  describe('markAsRead', () => {
    it('should call service markAsRead and return notification', async () => {
      const req = { tenantId: 't1', user: { userId: 'usr-1' } };
      const mockNotif = { id: 'n1', isRead: true };
      serviceMock.markAsRead.mockResolvedValue(mockNotif);

      const response = await controller.markAsRead('n1', req);

      expect(serviceMock.markAsRead).toHaveBeenCalledWith('t1', 'usr-1', 'n1');
      expect(response).toEqual({
        success: true,
        data: mockNotif,
      });
    });
  });
});
