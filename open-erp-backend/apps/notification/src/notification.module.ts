import { Module } from '@nestjs/common';
import { LoggerModule } from '@shared/logger';
import { NotificationController } from './notification.controller';
import { NotificationRpcController } from './notification-rpc.controller';
import { NotificationEventController } from './notification-event.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { RabbitMQClientModule } from '@shared/rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { UserNotification, UserNotificationSchema } from '@shared/schemas';
import { UserNotificationService } from './user-notification.service';
import { UserNotificationController } from './user-notification.controller';
import { UserNotificationGateway } from './user-notification.gateway';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    RabbitMQClientModule.forRoot(), // Add NestJS ClientProxy module
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: UserNotification.name, schema: UserNotificationSchema },
    ]),
  ],
  controllers: [
    NotificationController,
    NotificationRpcController,
    NotificationEventController,
    UserNotificationController,
  ],
  providers: [
    NotificationService,
    EmailService,
    UserNotificationService,
    UserNotificationGateway,
  ],
})
export class NotificationModule {}
