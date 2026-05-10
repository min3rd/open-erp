import { DynamicModule, Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqModuleOptions } from './interfaces/rabbitmq-options.interface';
import { RABBITMQ_OPTIONS } from './tokens/rabbitmq.tokens';

@Global()
@Module({})
export class RabbitmqModule {
  static forRoot(options: RabbitmqModuleOptions): DynamicModule {
    return {
      module: RabbitmqModule,
      providers: [
        {
          provide: RABBITMQ_OPTIONS,
          useValue: options,
        },
        RabbitmqService,
      ],
      exports: [RabbitmqService],
    };
  }
}
