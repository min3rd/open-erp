import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicForm } from './entities/dynamic-form.entity';
import { DynamicFormService } from './dynamic-form.service';

@Module({
  imports: [TypeOrmModule.forFeature([DynamicForm])],
  providers: [DynamicFormService],
  exports: [DynamicFormService, TypeOrmModule],
})
export class DynamicFormCoreModule {}
