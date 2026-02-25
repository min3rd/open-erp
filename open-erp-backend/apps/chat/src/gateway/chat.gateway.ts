import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '@shared/authz/utils/token.util';
import { MessageService } from '../services/message.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageType } from '@shared/schemas';
import { Types } from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationRepository: ConversationRepository,
  ) {
    this.jwtSecret =
      process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  /**
   * Handle client connection — authenticate via JWT in handshake
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const decoded = verifyToken(token, this.jwtSecret);
      if (!decoded) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = decoded.sub;
      client.email = decoded.email;

      // Join a personal room for targeted notifications
      client.join(`user:${decoded.sub}`);

      this.logger.log({
        event: 'ws.connected',
        clientId: client.id,
        userId: decoded.sub,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log({
      event: 'ws.disconnected',
      clientId: client.id,
      userId: client.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Client joins a conversation room to receive messages
   */
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    const { conversationId } = data;

    // Verify participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      new Types.ObjectId(client.userId),
    );

    if (!isParticipant) {
      client.emit('error', {
        message: 'Not a participant of this conversation',
      });
      return;
    }

    client.join(`conversation:${conversationId}`);

    this.logger.log({
      event: 'ws.joinConversation',
      clientId: client.id,
      userId: client.userId,
      conversationId,
    });

    return { status: 'joined', conversationId };
  }

  /**
   * Client leaves a conversation room
   */
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);

    this.logger.log({
      event: 'ws.leaveConversation',
      clientId: client.id,
      userId: client.userId,
      conversationId: data.conversationId,
    });

    return { status: 'left', conversationId: data.conversationId };
  }

  /**
   * Client sends a message via WebSocket
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      type: MessageType;
      content?: string;
      attachments?: {
        url: string;
        filename: string;
        mimeType: string;
        size: number;
      }[];
    },
  ) {
    if (!client.userId) return;

    try {
      const message = await this.messageService.sendMessage(
        client.userId,
        data.conversationId,
        data.type,
        data.content,
        data.attachments,
      );

      // Broadcast to all clients in the conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newMessage', message);

      // Also notify individual participants who may not be in the room
      const conversation = await this.conversationRepository.findById(
        data.conversationId,
      );
      if (conversation) {
        for (const participantId of conversation.participants) {
          const pid = participantId.toString();
          if (pid !== client.userId) {
            this.server.to(`user:${pid}`).emit('newMessage', message);
          }
        }
      }

      return { status: 'sent', messageId: message._id };
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * Client edits a message via WebSocket
   */
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      messageId: string;
      content?: string;
      attachments?: {
        url: string;
        filename: string;
        mimeType: string;
        size: number;
      }[];
    },
  ) {
    if (!client.userId) return;

    try {
      const updated = await this.messageService.editMessage(
        client.userId,
        data.messageId,
        data.content,
        data.attachments,
      );

      // Broadcast edited message to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messageEdited', updated);

      return { status: 'edited', messageId: data.messageId };
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * Client deletes a message via WebSocket (within 5-minute window)
   */
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      messageId: string;
    },
  ) {
    if (!client.userId) return;

    try {
      await this.messageService.deleteMessage(client.userId, data.messageId);

      // Broadcast deletion to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messageDeleted', {
          messageId: data.messageId,
          conversationId: data.conversationId,
          deletedBy: client.userId,
        });

      return { status: 'deleted', messageId: data.messageId };
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) return;

    // Broadcast typing indicator to others in the conversation
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Broadcast a new message to all participants in a conversation.
   * Called by MessageController when a message is sent via the REST API,
   * so that clients receive real-time updates regardless of which transport
   * (WS or HTTP) was used to send the message.
   */
  async broadcastNewMessage(
    conversationId: string,
    message: any,
    senderUserId: string,
  ): Promise<void> {
    // Notify clients that have joined the conversation room
    this.server
      .to(`conversation:${conversationId}`)
      .emit('newMessage', message);

    // Also notify participants via their personal rooms (for those not in the room)
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (conversation) {
      for (const participantId of conversation.participants) {
        const pid = participantId.toString();
        if (pid !== senderUserId) {
          this.server.to(`user:${pid}`).emit('newMessage', message);
        }
      }
    }
  }

  /**
   * Mark messages as read via WebSocket
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    try {
      const result = await this.messageService.markAsRead(
        client.userId,
        data.conversationId,
      );

      // Broadcast read receipt to the conversation
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messagesRead', {
          userId: client.userId,
          conversationId: data.conversationId,
          markedAsRead: result.markedAsRead,
        });

      return result;
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
