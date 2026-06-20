import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { ResponseUtil } from '../../../common/utils/response.util';
import { InterviewsService } from '../application/services/interviews.service';
import { ApiInterviewFeedbackPaginatedResponse } from '../decorators/api-interview-feedback-paginated-response.decorator';
import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { InterviewFeedbackResponseDto } from '../dto/interview-feedback.response.dto';
import { ListInterviewFeedbackQueryDto } from '../dto/list-interview-feedback.query.dto';
import { SubmitInterviewFeedbackDto } from '../dto/submit-interview-feedback.dto';
import { InterviewsMapper } from '../helpers/interviews.mapper';

@ApiTags('Interviews - Feedback')
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
export class InterviewFeedbackController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post(':interviewId/feedback')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.INTERVIEWER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit interview feedback (panel members only)' })
  @ApiParam({ name: 'interviewId', description: 'Interview UUID' })
  @ApiBody({ type: SubmitInterviewFeedbackDto })
  @ApiStandardResponse(
    InterviewFeedbackResponseDto,
    'Feedback submitted successfully',
  )
  async submit(
    @Param('interviewId') interviewId: string,
    @Body() dto: SubmitInterviewFeedbackDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const feedback = await this.interviewsService.submitFeedback(
      interviewId,
      dto,
      actor?.sub,
    );

    return ResponseUtil.success(
      'Feedback submitted successfully',
      InterviewsMapper.toFeedbackResponse(feedback),
    );
  }

  @Get(':interviewId/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List feedback by interview (offset or cursor pagination)',
  })
  @ApiParam({ name: 'interviewId', description: 'Interview UUID' })
  @ApiInterviewFeedbackPaginatedResponse(
    InterviewFeedbackResponseDto,
    'Feedback fetched successfully',
  )
  async listByInterview(
    @Param('interviewId') interviewId: string,
    @Query() query: ListInterviewFeedbackQueryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.interviewsService.listFeedbackByInterview(
      interviewId,
      query,
      actor,
    );

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Feedback fetched successfully', {
        data: result.data.map(InterviewsMapper.toFeedbackResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Feedback fetched successfully',
      result.data.map(InterviewsMapper.toFeedbackResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('feedback/by-application/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List feedback by application (offset or cursor pagination)',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiInterviewFeedbackPaginatedResponse(
    InterviewFeedbackResponseDto,
    'Feedback fetched successfully',
  )
  async listByApplication(
    @Param('applicationId') applicationId: string,
    @Query() query: ListInterviewFeedbackQueryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.interviewsService.listFeedbackByApplication(
      applicationId,
      query,
      actor,
    );

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Feedback fetched successfully', {
        data: result.data.map(InterviewsMapper.toFeedbackResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Feedback fetched successfully',
      result.data.map(InterviewsMapper.toFeedbackResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }
}
