import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageModule as CoreStorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreStorageModule, AuthModule],
  controllers: [StorageController],
})
export class StorageModule {}
