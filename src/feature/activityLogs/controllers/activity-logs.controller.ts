import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { ActivityLogsService } from '../application/services/activity-logs.service';
import { ListActivityLogsQueryDto } from '../dto/list-activity-logs.query.dto';
import { ActivityLogResponseDto } from '../dto/activity-log.response.dto';
import { ApiActivityLogsPaginatedResponse } from '../decorators/api-activity-logs-paginated-response.decorator';
import { ActivityLogsMapper } from '../helpers/activity-logs.mapper';

@ApiTags('Activity Logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get activity log by id' })
  @ApiParam({ name: 'id', description: 'Activity log UUID' })
  @ApiStandardResponse(
    ActivityLogResponseDto,
    'Activity log fetched successfully',
  )
  async findById(@Param('id') id: string) {
    const row = await this.activityLogsService.findById(id);
    return ResponseUtil.success(
      'Activity log fetched successfully',
      ActivityLogsMapper.toResponse(row),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List activity logs (offset or cursor pagination)' })
  @ApiActivityLogsPaginatedResponse(
    ActivityLogResponseDto,
    'Activity logs fetched successfully',
  )
  async list(@Query() query: ListActivityLogsQueryDto) {
    const result = await this.activityLogsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Activity logs fetched successfully', {
        data: result.data.map(ActivityLogsMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Activity logs fetched successfully',
      result.data.map(ActivityLogsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }
}
