import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantSchema } from '../tenant/schemas/tenant.schema';
import { AvatarService } from './avatar/avatar.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { TenantCreatedHandler } from './events/tenant.handler';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [UsersController, DepartmentsController],
  providers: [
    RabbitMQService,
    UsersService,
    DepartmentsService,
    AvatarService,
    TenantCreatedHandler,
  ],
})
export class UsersModule {}
