import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '@shared/authz/utils/token.util';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class UserNotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserNotificationGateway.name);
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret =
      process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const decoded = verifyToken(token, this.jwtSecret);
      if (!decoded) {
        client.disconnect();
        return;
      }
      client.userId = decoded.sub;
      client.join(`user:${decoded.sub}`);
      this.logger.log(`Notification WS connected: ${decoded.sub}`);
    } catch (err) {
      this.logger.error('WS connection error', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Notification WS disconnected: ${client.userId ?? client.id}`);
  }

  /** Push a new notification to a specific user */
  pushNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new', { event: 'new', notification });
  }

  /** Push updated unread count to a specific user */
  pushUnreadCount(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unreadCount', { unreadCount });
  }
}
