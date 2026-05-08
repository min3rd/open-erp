import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeModule } from './employee/employee.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { DepartmentModule } from './department/department.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.HR_DB_URI || 'mongodb://localhost:27017/hr_db',
      }),
    }),
    EmployeeModule,
    LeaveRequestModule,
    DepartmentModule,
  ],
  controllers: [HealthController],
})
export class HrModule {}
