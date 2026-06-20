import {
  Body,
  Controller,
  Delete,
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

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

import { FeedbackAiSummariesService } from '../application/services/feedback-ai-summaries.service';
import { ApiFeedbackAiSummariesPaginatedResponse } from '../decorators/api-feedback-ai-summaries-paginated-response.decorator';
import { FeedbackAiSummaryResponseDto } from '../dto/feedback-ai-summary.response.dto';
import { GenerateFeedbackAiSummaryDto } from '../dto/generate-feedback-ai-summary.dto';
import { ListFeedbackAiSummariesQueryDto } from '../dto/list-feedback-ai-summaries.query.dto';
import { AiInsightsMapper } from '../helpers/ai-insights.mapper';

@ApiTags('AI Insights - Feedback Summaries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-insights/feedback-summaries')
export class FeedbackAiSummariesController {
  constructor(
    private readonly feedbackAiSummariesService: FeedbackAiSummariesService,
  ) {}

  @Post()
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate feedback AI summary for an application' })
  @ApiBody({ type: GenerateFeedbackAiSummaryDto })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary generated successfully',
  )
  async generate(
    @Body() dto: GenerateFeedbackAiSummaryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const row = await this.feedbackAiSummariesService.generate(dto, actor?.sub);
    return ResponseUtil.success(
      'Feedback AI summary generated successfully',
      AiInsightsMapper.toFeedbackSummaryResponse(row),
    );
  }

  @Post('generate')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate feedback AI summary (alias endpoint)' })
  @ApiBody({ type: GenerateFeedbackAiSummaryDto })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary generated successfully',
  )
  async generateAlias(
    @Body() dto: GenerateFeedbackAiSummaryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    return this.generate(dto, actor);
  }

  @Post(':id/regenerate')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate feedback AI summary by id' })
  @ApiParam({ name: 'id', description: 'Feedback AI summary UUID' })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary regenerated successfully',
  )
  async regenerateById(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const existing = await this.feedbackAiSummariesService.findById(id);
    const row = await this.feedbackAiSummariesService.regenerate(
      existing.application_id,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Feedback AI summary regenerated successfully',
      AiInsightsMapper.toFeedbackSummaryResponse(row),
    );
  }

  @Post('by-application/:applicationId/regenerate')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate feedback AI summary for an application',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary regenerated successfully',
  )
  async regenerate(
    @Param('applicationId') applicationId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const row = await this.feedbackAiSummariesService.regenerate(
      applicationId,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Feedback AI summary regenerated successfully',
      AiInsightsMapper.toFeedbackSummaryResponse(row),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feedback AI summary by id' })
  @ApiParam({ name: 'id', description: 'Feedback AI summary UUID' })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary fetched successfully',
  )
  async findById(@Param('id') id: string) {
    const row = await this.feedbackAiSummariesService.findById(id);
    return ResponseUtil.success(
      'Feedback AI summary fetched successfully',
      AiInsightsMapper.toFeedbackSummaryResponse(row),
    );
  }

  @Get('by-application/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feedback AI summary by application id' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary fetched successfully',
  )
  async findByApplicationId(@Param('applicationId') applicationId: string) {
    const row =
      await this.feedbackAiSummariesService.findByApplicationId(applicationId);
    return ResponseUtil.success(
      'Feedback AI summary fetched successfully',
      AiInsightsMapper.toFeedbackSummaryResponse(row),
    );
  }

  @Get('application/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get feedback AI summary by application id (alias)',
  })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiStandardResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summary fetched successfully',
  )
  async findByApplicationIdAlias(
    @Param('applicationId') applicationId: string,
  ) {
    return this.findByApplicationId(applicationId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List feedback AI summaries (offset or cursor pagination)',
  })
  @ApiFeedbackAiSummariesPaginatedResponse(
    FeedbackAiSummaryResponseDto,
    'Feedback AI summaries fetched successfully',
  )
  async list(@Query() query: ListFeedbackAiSummariesQueryDto) {
    const result = await this.feedbackAiSummariesService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'Feedback AI summaries fetched successfully',
        {
          data: result.data.map(AiInsightsMapper.toFeedbackSummaryResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'Feedback AI summaries fetched successfully',
      result.data.map(AiInsightsMapper.toFeedbackSummaryResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Delete(':id')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (soft) feedback AI summary by id' })
  @ApiParam({ name: 'id', description: 'Feedback AI summary UUID' })
  @ApiStandardResponse(Object, 'Feedback AI summary deleted successfully')
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    await this.feedbackAiSummariesService.delete(id, actor?.sub);
    return ResponseUtil.success('Feedback AI summary deleted successfully', {
      id,
    });
  }
}
