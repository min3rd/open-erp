import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentTemplate } from './entities/document-template.entity';
import { DocumentTemplateService } from './document-template.service';
import { StorageModule } from '../storage/storage.module';
import { WorkflowInstance } from '../workflow/entities/workflow-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentTemplate, WorkflowInstance]),
    StorageModule,
  ],
  providers: [DocumentTemplateService],
  exports: [DocumentTemplateService, TypeOrmModule],
})
export class CoreDocumentTemplateModule {}
