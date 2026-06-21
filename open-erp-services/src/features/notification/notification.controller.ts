import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { NotificationService } from '../../core/notification/notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Query() query: { page?: number; limit?: number },
    @Req() req: any,
  ) {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const result = await this.notificationService.getNotifications(tenantId, userId, query);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const notif = await this.notificationService.markAsRead(tenantId, userId, id);
    return {
      success: true,
      data: notif,
    };
  }
}
