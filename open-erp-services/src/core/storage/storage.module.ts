import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysFile } from './file.entity';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysFile])],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
