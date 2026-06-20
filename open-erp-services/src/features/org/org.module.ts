import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Employee } from './entities/employee.entity';
import { User } from '../../core/user/user.entity';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MailModule } from '../../core/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, Department, Employee, User]),
    JwtModule.register({
      secret: 'super-secret-jwt-key',
    }),
    MailModule,
  ],
  controllers: [BranchController, DepartmentController, UserController],
  providers: [BranchService, DepartmentService, UserService],
  exports: [BranchService, DepartmentService, UserService],
})
export class OrgModule {}

