import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';
import * as bcrypt from 'bcrypt';
import { LoggerService } from './logger.service';

interface User {
  id: string;
  username: string;
  password: string;
  email: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private users: Map<string, User> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly rabbitMQClient: RabbitMQClient,
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit() {
    // Start consuming RPC requests
    await this.startRPCConsumer();
  }

  async login(loginDto: { username: string; password: string }) {
    const user = this.users.get(loginDto.username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    // Publish login event
    await this.rabbitMQClient.publish(
      'auth.events',
      'auth.user.login',
      {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      }
    );

    this.loggerService.log('User logged in', { userId: user.id, username: user.username });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(registerDto: { username: string; password: string; email: string }) {
    if (this.users.has(registerDto.username)) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user: User = {
      id: this.generateId(),
      username: registerDto.username,
      password: hashedPassword,
      email: registerDto.email,
    };

    this.users.set(user.username, user);

    // Publish registration event
    await this.rabbitMQClient.publish(
      'auth.events',
      'auth.user.registered',
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        timestamp: new Date().toISOString(),
      }
    );

    this.loggerService.log('User registered', { userId: user.id, username: user.username });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async startRPCConsumer() {
    await this.rabbitMQClient.consume(
      'auth.rpc.queue',
      async (content, message, ack, nack, reject) => {
        try {
          if (content.action === 'validate_token') {
            const result = await this.validateToken(content.token);
            
            // Send response back
            await this.rabbitMQClient.publish(
              '',
              message.properties.replyTo,
              { success: true, payload: result },
              {
                correlationId: message.properties.correlationId,
              }
            );
          }
          
          ack();
        } catch (error: any) {
          this.loggerService.error('RPC error', error);
          
          // Send error response
          if (message.properties.replyTo) {
            await this.rabbitMQClient.publish(
              '',
              message.properties.replyTo,
              { success: false, error: error.message },
              {
                correlationId: message.properties.correlationId,
              }
            );
          }
          
          ack();
        }
      }
    );

    this.loggerService.log('Started RPC consumer for auth service');
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
