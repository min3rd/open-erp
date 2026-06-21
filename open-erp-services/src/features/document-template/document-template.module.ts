import { Module } from '@nestjs/common';
import { DocumentTemplateController } from './document-template.controller';
import { CoreDocumentTemplateModule } from '../../core/document-template/document-template.module';
import { StorageModule as CoreStorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreDocumentTemplateModule, CoreStorageModule, AuthModule],
  controllers: [DocumentTemplateController],
})
export class DocumentTemplateModule {}
