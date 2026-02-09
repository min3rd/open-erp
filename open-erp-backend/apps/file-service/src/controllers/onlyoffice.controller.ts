import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, Public } from '@shared/authz';
import { fetched } from '@shared/response';
import { OnlyOfficeService } from '../services/onlyoffice.service';
import { CreateOnlyOfficeSessionDto } from '../dto';

@ApiTags('onlyoffice')
@Controller('onlyoffice')
export class OnlyOfficeController {
  constructor(private readonly onlyOfficeService: OnlyOfficeService) {}

  @Post('session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an OnlyOffice editing/viewing session' })
  @ApiResponse({ status: 200, description: 'OnlyOffice session config' })
  async createSession(
    @Body() dto: CreateOnlyOfficeSessionDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.onlyOfficeService.createSession(
      dto.fileId,
      dto.mode || 'edit',
      user?.userId,
      undefined,
      dto.minioKey,
      dto.filename,
      dto.bucket,
    );
    return fetched(result);
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OnlyOffice document save callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async callback(@Body() body: Record<string, any>) {
    const result = await this.onlyOfficeService.handleCallback(body);
    return result;
  }
}
