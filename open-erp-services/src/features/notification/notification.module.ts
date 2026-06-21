import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { CoreNotificationModule } from '../../core/notification/notification.module';

@Module({
  imports: [
    CoreNotificationModule,
    JwtModule.register({
      secret: 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [NotificationController],
})
export class FeatureNotificationModule {}
