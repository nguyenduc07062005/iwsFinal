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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from 'src/database/entities/user.entity';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';
import { Roles } from '../authentication/roles/roles.decorator';
import { RolesGuard } from '../authentication/roles/roles.guard';
import { AdminService } from './admin.service';
import { ListAdminAuditLogsDto } from './dtos/list-admin-audit-logs.dto';
import { ListAdminUsersDto } from './dtos/list-admin-users.dto';
import { UpdateUserRoleDto } from './dtos/update-user-role.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';

type AdminRequest = Request & {
  user: {
    userId: string;
    role: UserRole;
  };
};

@ApiTags('admin')
@ApiBearerAuth('bearer')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Query() query: ListAdminUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Get('audit-logs')
  async listAuditLogs(@Query() query: ListAdminAuditLogsDto) {
    return this.adminService.listAuditLogs(query);
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

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @Req() req: AdminRequest,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(targetUserId, req.user.userId, dto);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
