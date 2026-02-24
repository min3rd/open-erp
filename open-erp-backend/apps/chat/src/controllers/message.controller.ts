import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/authz';
import { ok, created, paginated } from '@shared/response';
import { AuthenticatedRequest } from '@shared/interfaces';
import { MessageService } from '../services/message.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { EditMessageDto } from '../dto/edit-message.dto';
import { ListMessagesQueryDto } from '../dto/list-messages-query.dto';

@ApiTags('messages')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post(':conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Send a message to a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.messageService.sendMessage(
      req.user.userId,
      conversationId,
      dto.type,
      dto.content,
      dto.attachments,
    );
    return created(result, 'Message sent');
  }

  @Patch(':conversationId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Edit a message (saves previous content to edit history)',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message edited' })
  @ApiResponse({ status: 403, description: 'Not the message sender' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async editMessage(
    @Request() req: AuthenticatedRequest,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    const result = await this.messageService.editMessage(
      req.user.userId,
      messageId,
      dto.content,
      dto.attachments,
    );
    return ok(result, 'Message edited');
  }

  @Delete(':conversationId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a message (only within 5 minutes of sending)',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  @ApiResponse({ status: 400, description: 'Delete window expired (5 min)' })
  @ApiResponse({ status: 403, description: 'Not the message sender' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req: AuthenticatedRequest,
    @Param('messageId') messageId: string,
  ) {
    const result = await this.messageService.deleteMessage(
      req.user.userId,
      messageId,
    );
    return ok(result, 'Message deleted');
  }

  @Get(':conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'List messages in a conversation with pagination' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    const result = await this.messageService.getMessages(
      req.user.userId,
      conversationId,
      query.page,
      query.limit,
      query.before,
    );
    return paginated(
      result.items,
      query.page || 1,
      query.limit || 50,
      result.total,
      undefined,
      'Messages retrieved',
    );
  }

  @Post(':conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const result = await this.messageService.markAsRead(
      req.user.userId,
      conversationId,
    );
    return ok(result, 'Messages marked as read');
  }
}
