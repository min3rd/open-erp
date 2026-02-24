import {
  Controller,
  Post,
  Get,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/authz';
import { ok, created, paginated } from '@shared/response';
import { AuthenticatedRequest } from '@shared/interfaces';
import { ConversationService } from '../services/conversation.service';
import { CreateDirectConversationDto } from '../dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from '../dto/create-group-conversation.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a direct (1-to-1) conversation' })
  @ApiResponse({
    status: 201,
    description: 'Direct conversation created or existing returned',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createDirect(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateDirectConversationDto,
  ) {
    const result = await this.conversationService.createDirect(
      req.user.userId,
      dto.participantId,
    );
    return created(result, 'Direct conversation ready');
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a group conversation' })
  @ApiResponse({ status: 201, description: 'Group conversation created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createGroup(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateGroupConversationDto,
  ) {
    const result = await this.conversationService.createGroup(
      req.user.userId,
      dto.name,
      dto.participantIds,
      dto.avatarUrl,
    );
    return created(result, 'Group conversation created');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List conversations for the current user' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  async getConversations(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.conversationService.getConversations(
      req.user.userId,
      Number(page),
      Number(limit),
    );
    return paginated(
      result.items,
      Number(page),
      Number(limit),
      result.total,
      undefined,
      'Conversations retrieved',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const result = await this.conversationService.getConversation(
      id,
      req.user.userId,
    );
    return ok(result, 'Conversation retrieved');
  }
}
