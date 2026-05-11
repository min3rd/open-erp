import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../common/services/rabbitmq.service';
import { UsersService } from '../users.service';

@Injectable()
export class TenantCreatedHandler implements OnModuleInit {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMQService.subscribe('tenant.created', async (payload) => {
      if (!payload?.tenantId || !payload?.adminEmail) {
        return;
      }

      await this.usersService.bootstrapTenantAdmin({
        tenantId: String(payload.tenantId),
        adminEmail: String(payload.adminEmail),
        plan: payload.plan ? String(payload.plan) : undefined,
      });
    });
  }
}
