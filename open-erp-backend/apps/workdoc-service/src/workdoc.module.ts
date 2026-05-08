import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentModule } from './document/document.module';
import { WorkflowModule } from './workflow/workflow.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.WORKDOC_DB_URI || 'mongodb://localhost:27017/workdoc_db',
      }),
    }),
    DocumentModule,
    WorkflowModule,
  ],
  controllers: [HealthController],
})
export class WorkdocModule {}
