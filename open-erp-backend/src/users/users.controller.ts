import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AvatarService } from './avatar/avatar.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get()
  async listUsers(@Req() req: Request) {
    return this.usersService.listUsers(req.query as Record<string, unknown>, req.user);
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.usersService.createUser(dto, req.user);
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    return this.usersService.getMe(req.user as Express.User);
  }

  @Patch('me')
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    return this.usersService.updateMe(req.user as Express.User, dto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.getUserById(id, req.user);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    return this.usersService.updateUser(id, dto, req.user);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.deleteUser(id, req.user);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    const upload = await this.avatarService.uploadAvatar({
      tenantId: req.user?.tenantId ?? req.tenantId ?? '',
      userId: id,
      file,
    });

    return this.usersService.uploadAvatar(id, upload.avatarUrl, upload.metadata, req.user);
  }
}