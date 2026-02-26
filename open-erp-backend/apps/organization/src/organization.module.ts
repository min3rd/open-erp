import { Module } from '@nestjs/common';
import { LoggerModule } from '@shared/logger';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQClientModule } from '@shared/rabbitmq';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { MinioModule } from '@shared/services/minio/minio.module';

// Schemas
import {
  Organization,
  OrganizationSchema,
  OrganizationRelation,
  OrganizationRelationSchema,
  OrganizationMember,
  OrganizationMemberSchema,
  OrganizationInvitation,
  OrganizationInvitationSchema,
  OrganizationAuditEvent,
  OrganizationAuditEventSchema,
  Warehouse,
  WarehouseSchema,
  Province,
  ProvinceSchema,
  Ward,
  WardSchema,
  User,
  UserSchema,
  Department,
  DepartmentSchema,
  Position,
  PositionSchema,
} from '@shared/schemas';

// Controllers
import { OrganizationController } from './controllers/organization.controller';
import { InvitationController } from './controllers/invitation.controller';
import { MembershipController } from './controllers/membership.controller';
import { RelationController } from './controllers/relation.controller';
import { HealthController } from './controllers/health.controller';
import { OrgAdminController } from './controllers/org-admin.controller';
import { AccessControlController } from './controllers/access-control.controller';
import { OrgMembersController } from './controllers/org-members.controller';
import { WarehouseController } from '../../inventory/src/controllers/warehouse.controller';

// Services
import { OrganizationService } from './services/organization.service';
import { InvitationService } from './services/invitation.service';
import { MembershipService } from './services/membership.service';
import { RelationService } from './services/relation.service';
import { AuditService } from './services/audit.service';
import { OrgAdminService } from './services/org-admin.service';
import { OrgMembersService } from './services/org-members.service';
import { WarehouseService } from '../../inventory/src/services/warehouse.service';

// Repositories
import { OrganizationRepository } from './repositories/organization.repository';
import { OrganizationRelationRepository } from './repositories/organization-relation.repository';
import { OrganizationMemberRepository } from './repositories/organization-member.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { AuditEventRepository } from './repositories/audit-event.repository';
import { WarehouseRepository } from '../../inventory/src/repositories/warehouse.repository';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    RabbitMQClientModule.forRoot(),
    MinioModule,
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationRelation.name, schema: OrganizationRelationSchema },
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
      {
        name: OrganizationInvitation.name,
        schema: OrganizationInvitationSchema,
      },
      {
        name: OrganizationAuditEvent.name,
        schema: OrganizationAuditEventSchema,
      },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Province.name, schema: ProvinceSchema },
      { name: Ward.name, schema: WardSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
  ],
  controllers: [
    OrganizationController,
    InvitationController,
    MembershipController,
    RelationController,
    HealthController,
    OrgAdminController,
    AccessControlController,
    OrgMembersController,
    WarehouseController,
  ],
  providers: [
    OrganizationService,
    InvitationService,
    MembershipService,
    RelationService,
    AuditService,
    OrgAdminService,
    OrgMembersService,
    WarehouseService,
    OrganizationRepository,
    OrganizationRelationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    AuditEventRepository,
    WarehouseRepository,
  ],
})
export class OrganizationModule {}
