import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

import { InterviewProctoringEventsService } from '../application/services/interview-proctoring-events.service';
import { ApiInterviewProctoringEventsArrayResponse } from '../decorators/api-interview-proctoring-events-array-response.decorator';
import { ApiInterviewProctoringEventsPaginatedResponse } from '../decorators/api-interview-proctoring-events-paginated-response.decorator';
import { BulkCreateProctoringEventsDto } from '../dto/bulk-create-proctoring-events.dto';
import { CreateProctoringEventDto } from '../dto/create-proctoring-event.dto';
import { DeleteInterviewProctoringEventResponseDto } from '../dto/delete-interview-proctoring-event.response.dto';
import { InterviewProctoringEventQueryDto } from '../dto/interview-proctoring-event.query.dto';
import { InterviewProctoringEventResponseDto } from '../dto/interview-proctoring-event.response.dto';
import { ProctoringRiskSummaryResponseDto } from '../dto/proctoring-risk-summary.response.dto';
import { ResolveProctoringEventDto } from '../dto/resolve-proctoring-event.dto';
import { InterviewProctoringEventsMapper } from '../helpers/interview-proctoring-events.mapper';

@ApiTags('Interview Proctoring Events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('interview-proctoring-events')
export class InterviewProctoringEventsController {
  constructor(private readonly service: InterviewProctoringEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a proctoring event for an AI interview session',
  })
  @ApiBody({ type: CreateProctoringEventDto })
  @ApiStandardResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring event created successfully',
  )
  async create(
    @Body() dto: CreateProctoringEventDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const event = await this.service.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Interview proctoring event created successfully',
      InterviewProctoringEventsMapper.toResponse(event),
    );
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create proctoring events for an AI interview session',
  })
  @ApiBody({ type: BulkCreateProctoringEventsDto })
  @ApiInterviewProctoringEventsArrayResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring events created successfully',
  )
  async bulkCreate(
    @Body() dto: BulkCreateProctoringEventsDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const events = await this.service.bulkCreate(dto, actor?.sub);
    return ResponseUtil.success(
      'Interview proctoring events created successfully',
      events.map(InterviewProctoringEventsMapper.toResponse),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List interview proctoring events with offset or cursor pagination',
  })
  @ApiInterviewProctoringEventsPaginatedResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring events fetched successfully',
  )
  async list(@Query() query: InterviewProctoringEventQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'Interview proctoring events fetched successfully',
        {
          data: result.data.map(InterviewProctoringEventsMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'Interview proctoring events fetched successfully',
      result.data.map(InterviewProctoringEventsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('session/:sessionId/risk-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get proctoring risk summary for an AI interview session',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    ProctoringRiskSummaryResponseDto,
    'Interview proctoring risk summary fetched successfully',
  )
  async getRiskSummary(@Param('sessionId') sessionId: string) {
    const summary = await this.service.getRiskSummary(sessionId);
    return ResponseUtil.success(
      'Interview proctoring risk summary fetched successfully',
      summary,
    );
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get proctoring events by AI interview session id' })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiInterviewProctoringEventsArrayResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring events fetched successfully',
  )
  async getBySession(@Param('sessionId') sessionId: string) {
    const events = await this.service.getBySession(sessionId);
    return ResponseUtil.success(
      'Interview proctoring events fetched successfully',
      events.map(InterviewProctoringEventsMapper.toResponse),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get interview proctoring event by id' })
  @ApiParam({ name: 'id', description: 'Interview proctoring event UUID' })
  @ApiStandardResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring event fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const event = await this.service.getById(id);
    return ResponseUtil.success(
      'Interview proctoring event fetched successfully',
      InterviewProctoringEventsMapper.toResponse(event),
    );
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an interview proctoring event' })
  @ApiParam({ name: 'id', description: 'Interview proctoring event UUID' })
  @ApiBody({ type: ResolveProctoringEventDto })
  @ApiStandardResponse(
    InterviewProctoringEventResponseDto,
    'Interview proctoring event resolved successfully',
  )
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveProctoringEventDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const event = await this.service.resolve(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Interview proctoring event resolved successfully',
      InterviewProctoringEventsMapper.toResponse(event),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete interview proctoring event' })
  @ApiParam({ name: 'id', description: 'Interview proctoring event UUID' })
  @ApiStandardResponse(
    DeleteInterviewProctoringEventResponseDto,
    'Interview proctoring event deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success(
      'Interview proctoring event deleted successfully',
      { id },
    );
  }
}
