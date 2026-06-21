import { Module } from '@nestjs/common';
import { DynamicFormCoreModule } from '../../core/dynamic-form/dynamic-form.module';
import { AuthModule } from '../auth/auth.module';
import { DynamicFormController } from './dynamic-form.controller';

@Module({
  imports: [DynamicFormCoreModule, AuthModule],
  controllers: [DynamicFormController],
})
export class DynamicFormModule {}
