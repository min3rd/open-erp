import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkDocument, WorkDocumentSchema } from './schemas/document.schema';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkDocument.name, schema: WorkDocumentSchema },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
