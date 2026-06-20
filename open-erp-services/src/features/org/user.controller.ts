import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { RequirePermissions } from '../../core/auth/permissions.decorator';
import { UserService } from './user.service';
import { InviteUserDto } from './dto/user.dto';

@Controller('org/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('invite')
  @RequirePermissions('ORG_CREATE')
  @HttpCode(HttpStatus.CREATED)
  async invite(@Body() dto: InviteUserDto, @Req() req: any) {
    const tenantId = req.tenantId;
    return this.userService.invite(dto, tenantId);
  }

  @Get()
  @RequirePermissions('ORG_READ')
  async findAll(@Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.userService.findAll(tenantId);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/resend')
  @RequirePermissions('ORG_CREATE')
  @HttpCode(HttpStatus.OK)
  async resendInvite(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    return this.userService.resendInvite(id, tenantId);
  }

  @Delete(':id')
  @RequirePermissions('ORG_DELETE')
  async cancelInvite(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    await this.userService.cancelInvite(id, tenantId);
    return {
      success: true,
    };
  }
}
