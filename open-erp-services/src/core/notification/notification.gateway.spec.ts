import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let jwtServiceMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    jwtServiceMock = {
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate connection and join room if token is valid', async () => {
      const mockSocket: any = {
        id: 'socket-123',
        handshake: {
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        },
        join: jest.fn().mockResolvedValue({}),
        disconnect: jest.fn(),
      };

      jwtServiceMock.verifyAsync.mockResolvedValue({
        userId: 'usr-456',
        tenantId: 'tenant-789',
      });

      await gateway.handleConnection(mockSocket);

      expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', {
        secret: 'super-secret-jwt-key',
      });
      expect(mockSocket.join).toHaveBeenCalledWith('tenant_tenant-789_user_usr-456');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client if no token is found', async () => {
      const mockSocket: any = {
        id: 'socket-123',
        handshake: {
          headers: {},
          query: {},
          auth: {},
        },
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockSocket);

      expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client if JWT verification fails', async () => {
      const mockSocket: any = {
        id: 'socket-123',
        handshake: {
          query: { token: 'invalid-token' },
          headers: {},
        },
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

      await gateway.handleConnection(mockSocket);

      expect(jwtServiceMock.verifyAsync).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it('should emit event to room if server is defined', () => {
      const mockServer: any = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      gateway.server = mockServer;

      gateway.sendToUser('tenant-1', 'user-1', 'test-event', { val: 123 });

      expect(mockServer.to).toHaveBeenCalledWith('tenant_tenant-1_user_user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('test-event', { val: 123 });
    });
  });
});
