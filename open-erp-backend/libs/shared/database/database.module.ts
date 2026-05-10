import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

export interface DatabaseModuleOptions {
  uri: string;
  replicaSet?: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(uriOrOptions: string | DatabaseModuleOptions): DynamicModule {
    const config: DatabaseModuleOptions =
      typeof uriOrOptions === 'string' ? { uri: uriOrOptions } : uriOrOptions;

    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: config.uri,
            replicaSet: config.replicaSet ?? process.env.MONGO_REPLICA_SET ?? 'rs0',
            maxPoolSize: config.maxPoolSize ?? 10,
            minPoolSize: config.minPoolSize ?? 2,
            serverSelectionTimeoutMS: config.serverSelectionTimeoutMS ?? 5000,
            socketTimeoutMS: config.socketTimeoutMS ?? 45000,
            autoIndex: process.env.NODE_ENV !== 'production',
          }),
        }),
      ],
      exports: [MongooseModule],
    };
  }
}
