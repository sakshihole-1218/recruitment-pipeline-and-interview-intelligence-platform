import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { DashboardService } from '../application/dashboard.service';

@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  async getStats(@CurrentUser() user: AuthJwtPayload) {
    const stats = await this.dashboardService.getStats(user);
    return ResponseUtil.success('Dashboard stats fetched successfully', stats);
  }

  @Get('pipeline')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @ApiOperation({ summary: 'Get pipeline activity (applications by stage)' })
  async getPipelineActivity(@CurrentUser() user: AuthJwtPayload) {
    const data = await this.dashboardService.getPipelineActivity(user);
    return ResponseUtil.success('Pipeline activity fetched successfully', data);
  }

  @Get('activity')
  @Roles(SystemRoleCode.ADMIN)
  @ApiOperation({ summary: 'Get recent activity logs' })
  async getRecentActivity(@CurrentUser() user: AuthJwtPayload) {
    const data = await this.dashboardService.getRecentActivity(user);
    return ResponseUtil.success('Recent activity fetched successfully', data);
  }
}
