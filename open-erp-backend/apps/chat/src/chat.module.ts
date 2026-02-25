import { Module } from '@nestjs/common';
import { LoggerModule } from '@shared/logger';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';

// Schemas
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
  User,
  UserSchema,
} from '@shared/schemas';

// Controllers
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { HealthController } from './controllers/health.controller';

// Services
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

// Repositories
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';

// Gateway
import { ChatGateway } from './gateway/chat.gateway';
import { MinioModule } from '@shared/services/minio/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    MinioModule,
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ConversationController, MessageController, HealthController],
  providers: [
    ConversationService,
    MessageService,
    ConversationRepository,
    MessageRepository,
    ChatGateway,
  ],
})
export class ChatModule {}
