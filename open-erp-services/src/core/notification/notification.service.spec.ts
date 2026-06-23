import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

describe('NotificationService', () => {
  let service: NotificationService;
  let repoMock: any;
  let gatewayMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    repoMock = {
      save: jest.fn((n) => Promise.resolve({ ...n, id: 'notif-uuid', createdAt: new Date() })),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };

    gatewayMock = {
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repoMock,
        },
        {
          provide: NotificationGateway,
          useValue: gatewayMock,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should save notification and send realtime event', async () => {
      const data = {
        title: 'New Task',
        body: 'You have a new task.',
        type: 'WORKFLOW_PENDING' as any,
        link: '/inbox',
        parameters: { taskName: 'Test' },
      };

      const result = await service.createNotification('tenant-1', 'user-1', data);

      expect(repoMock.save).toHaveBeenCalled();
      expect(gatewayMock.sendToUser).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        'notification:received',
        expect.objectContaining({
          id: 'notif-uuid',
          title: 'New Task',
          type: 'WORKFLOW_PENDING',
          parameters: { taskName: 'Test' },
        }),
      );
      expect(result.id).toBe('notif-uuid');
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications list', async () => {
      const mockItems = [{ id: 'n1' }, { id: 'n2' }];
      repoMock.findAndCount.mockResolvedValue([mockItems, 15]);

      const result = await service.getNotifications('tenant-1', 'user-1', { page: 1, limit: 10 });

      expect(repoMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1', userId: 'user-1' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.items).toEqual(mockItems);
      expect(result.meta.totalItems).toBe(15);
      expect(result.meta.totalPages).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true if found', async () => {
      const mockNotif = { id: 'n1', isRead: false, tenantId: 'tenant-1', userId: 'user-1' };
      repoMock.findOne.mockResolvedValue(mockNotif);

      await service.markAsRead('tenant-1', 'user-1', 'n1');

      expect(repoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'n1', tenantId: 'tenant-1', userId: 'user-1' },
      });
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'n1',
          isRead: true,
        }),
      );
    });

    it('should return null if not found', async () => {
      repoMock.findOne.mockResolvedValue(null);
      const result = await service.markAsRead('tenant-1', 'user-1', 'n1');
      expect(result).toBeNull();
    });
  });
});
