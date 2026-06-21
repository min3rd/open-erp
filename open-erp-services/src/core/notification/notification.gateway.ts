import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers['authorization'];
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = (client.handshake.auth?.token || client.handshake.query?.token) as string;
      }

      if (!token) {
        console.warn(`[WebSocket] Connection rejected: No token found for client ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'super-secret-jwt-key',
      });
      const userId = payload.userId;
      const tenantId = payload.tenantId || null;

      const roomName = `tenant_${tenantId}_user_${userId}`;
      await client.join(roomName);
      console.log(`[WebSocket] Client ${client.id} joined room ${roomName}`);
    } catch (err: any) {
      console.error(`[WebSocket] Authentication failed for client ${client.id}:`, err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  sendToUser(tenantId: string | null, userId: string, event: string, payload: any) {
    const roomName = `tenant_${tenantId}_user_${userId}`;
    if (this.server) {
      this.server.to(roomName).emit(event, payload);
      console.log(`[WebSocket] Sent event "${event}" to room "${roomName}"`);
    } else {
      console.warn(`[WebSocket] Server not initialized. Event "${event}" not sent to "${roomName}"`);
    }
  }
}
