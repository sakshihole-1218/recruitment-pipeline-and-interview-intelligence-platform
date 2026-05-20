import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { InterviewsService } from '../application/services/interviews.service';
import { ApiInterviewsPaginatedResponse } from '../decorators/api-interviews-paginated-response.decorator';
import { AssignInterviewPanelMembersDto } from '../dto/assign-interview-panel-members.dto';
import { CancelInterviewDto } from '../dto/cancel-interview.dto';
import { CompleteInterviewDto } from '../dto/complete-interview.dto';
import { InterviewResponseDto } from '../dto/interview.response.dto';
import { ListInterviewsQueryDto } from '../dto/list-interviews.query.dto';
import { RescheduleInterviewDto } from '../dto/reschedule-interview.dto';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';
import { InterviewsMapper } from '../helpers/interviews.mapper';

@ApiTags('Interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule interview' })
  @ApiBody({ type: ScheduleInterviewDto })
  @ApiStandardResponse(InterviewResponseDto, 'Interview scheduled successfully')
  async schedule(
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const interview = await this.interviewsService.scheduleInterview(dto, actor?.sub);

    return ResponseUtil.success(
      'Interview scheduled successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }

  @Post(':id/reschedule')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule interview (creates a new interview)' })
  @ApiParam({ name: 'id', description: 'Interview UUID to reschedule' })
  @ApiBody({ type: RescheduleInterviewDto })
  @ApiStandardResponse(InterviewResponseDto, 'Interview rescheduled successfully')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleInterviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const interview = await this.interviewsService.rescheduleInterview(id, dto, actor?.sub);

    return ResponseUtil.success(
      'Interview rescheduled successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }

  @Post(':id/cancel')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel interview' })
  @ApiParam({ name: 'id', description: 'Interview UUID to cancel' })
  @ApiBody({ type: CancelInterviewDto })
  @ApiStandardResponse(InterviewResponseDto, 'Interview cancelled successfully')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelInterviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const interview = await this.interviewsService.cancelInterview(id, dto, actor?.sub);

    return ResponseUtil.success(
      'Interview cancelled successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }

  @Post(':id/complete')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark interview as completed' })
  @ApiParam({ name: 'id', description: 'Interview UUID to complete' })
  @ApiBody({ type: CompleteInterviewDto })
  @ApiStandardResponse(InterviewResponseDto, 'Interview completed successfully')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteInterviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const interview = await this.interviewsService.completeInterview(id, dto, actor?.sub);

    return ResponseUtil.success(
      'Interview completed successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }

  @Put(':id/panel-members')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace interview panel members' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiBody({ type: AssignInterviewPanelMembersDto })
  @ApiStandardResponse(InterviewResponseDto, 'Interview panel updated successfully')
  async replacePanelMembers(
    @Param('id') id: string,
    @Body() dto: AssignInterviewPanelMembersDto,
  ) {
    const interview = await this.interviewsService.assignPanelMembers(id, dto);

    return ResponseUtil.success(
      'Interview panel updated successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List interviews (offset or cursor pagination)' })
  @ApiInterviewsPaginatedResponse(InterviewResponseDto, 'Interviews fetched successfully')
  async list(
    @Query() query: ListInterviewsQueryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.interviewsService.listInterviews(query, actor);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Interviews fetched successfully', {
        data: result.data.map(InterviewsMapper.toInterviewResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Interviews fetched successfully',
      result.data.map(InterviewsMapper.toInterviewResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get interview by id' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiStandardResponse(InterviewResponseDto, 'Interview fetched successfully')
  async findById(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const interview = await this.interviewsService.findInterviewById(id, actor);

    return ResponseUtil.success(
      'Interview fetched successfully',
      InterviewsMapper.toInterviewResponse(interview),
    );
  }
}
