import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/authz';
import { ok } from '@shared/response';
import { AuthenticatedRequest } from '@shared/interfaces';
import { UserNotificationService } from './user-notification.service';
import { UserNotificationGateway } from './user-notification.gateway';
import {
  ListNotificationsQueryDto,
  MarkNotificationsDto,
} from './dto/user-notification.dto';

@ApiTags('user-notifications')
@Controller('user-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
    private readonly gateway: UserNotificationGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const result = await this.userNotificationService.list(
      req.user.userId,
      query,
    );
    return ok({
      items: result.items,
      total: result.total,
      page: result.page,
      size: result.size,
      unreadCount: result.unreadCount,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.userNotificationService.unreadCount(req.user.userId);
    return ok({ unreadCount: count });
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as read' })
  async markRead(
    @Request() req: AuthenticatedRequest,
    @Body() dto: MarkNotificationsDto,
  ) {
    const result = await this.userNotificationService.markRead(
      req.user.userId,
      dto.ids,
    );
    const unreadCount = await this.userNotificationService.unreadCount(req.user.userId);
    this.gateway.pushUnreadCount(req.user.userId, unreadCount);
    return ok(result);
  }

  @Post('mark-unread')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as unread' })
  async markUnread(
    @Request() req: AuthenticatedRequest,
    @Body() dto: MarkNotificationsDto,
  ) {
    const result = await this.userNotificationService.markUnread(
      req.user.userId,
      dto.ids,
    );
    const unreadCount = await this.userNotificationService.unreadCount(req.user.userId);
    this.gateway.pushUnreadCount(req.user.userId, unreadCount);
    return ok(result);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Request() req: AuthenticatedRequest) {
    const result = await this.userNotificationService.markAllRead(req.user.userId);
    this.gateway.pushUnreadCount(req.user.userId, 0);
    return ok(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const result = await this.userNotificationService.deleteOne(req.user.userId, id);
    return ok(result);
  }
}
