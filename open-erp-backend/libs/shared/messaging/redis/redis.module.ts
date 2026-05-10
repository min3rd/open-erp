import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisModuleOptions } from './interfaces/redis-options.interface';
import { RedisService } from './redis.service';
import { REDIS_OPTIONS } from './tokens/redis.tokens';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_OPTIONS,
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
