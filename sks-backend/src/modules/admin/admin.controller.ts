import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from 'src/database/entities/user.entity';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';
import { Roles } from '../authentication/roles/roles.decorator';
import { RolesGuard } from '../authentication/roles/roles.guard';
import { AdminService } from './admin.service';
import { ListAdminUsersDto } from './dtos/list-admin-users.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';

type AdminRequest = Request & {
  user: {
    userId: string;
    role: UserRole;
  };
};

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Query() query: ListAdminUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @Req() req: AdminRequest,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(
      targetUserId,
      req.user.userId,
      dto,
    );
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
