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

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

import { ResumeAiAnalysesService } from '../application/services/resume-ai-analyses.service';
import { ApiResumeAiAnalysesPaginatedResponse } from '../decorators/api-resume-ai-analyses-paginated-response.decorator';
import { CreateResumeAiAnalysisDto } from '../dto/create-resume-ai-analysis.dto';
import { ListResumeAiAnalysesQueryDto } from '../dto/list-resume-ai-analyses.query.dto';
import { RegenerateResumeAiAnalysisDto } from '../dto/regenerate-resume-ai-analysis.dto';
import { ResumeAiAnalysisResponseDto } from '../dto/resume-ai-analysis.response.dto';
import { AiInsightsMapper } from '../helpers/ai-insights.mapper';

@ApiTags('AI Insights - Resume Analyses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-insights/resume-analyses')
export class ResumeAiAnalysesController {
  constructor(private readonly resumeAiAnalysesService: ResumeAiAnalysesService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create resume AI analysis' })
  @ApiBody({ type: CreateResumeAiAnalysisDto })
  @ApiStandardResponse(ResumeAiAnalysisResponseDto, 'Resume AI analysis created successfully')
  async create(
    @Body() dto: CreateResumeAiAnalysisDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const row = await this.resumeAiAnalysesService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Resume AI analysis created successfully',
      AiInsightsMapper.toResumeAnalysisResponse(row),
    );
  }

  @Post('by-document/:candidateDocumentId/regenerate')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate resume AI analysis for a candidate document' })
  @ApiParam({ name: 'candidateDocumentId', description: 'Candidate document UUID' })
  @ApiBody({ type: RegenerateResumeAiAnalysisDto })
  @ApiStandardResponse(ResumeAiAnalysisResponseDto, 'Resume AI analysis regenerated successfully')
  async regenerate(
    @Param('candidateDocumentId') candidateDocumentId: string,
    @Body() dto: RegenerateResumeAiAnalysisDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const row = await this.resumeAiAnalysesService.regenerate(
      candidateDocumentId,
      dto,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Resume AI analysis regenerated successfully',
      AiInsightsMapper.toResumeAnalysisResponse(row),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resume AI analysis by id' })
  @ApiParam({ name: 'id', description: 'Resume AI analysis UUID' })
  @ApiStandardResponse(ResumeAiAnalysisResponseDto, 'Resume AI analysis fetched successfully')
  async findById(@Param('id') id: string) {
    const row = await this.resumeAiAnalysesService.findById(id);
    return ResponseUtil.success(
      'Resume AI analysis fetched successfully',
      AiInsightsMapper.toResumeAnalysisResponse(row),
    );
  }

  @Get('by-document/:candidateDocumentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resume AI analysis by candidate document id' })
  @ApiParam({ name: 'candidateDocumentId', description: 'Candidate document UUID' })
  @ApiStandardResponse(ResumeAiAnalysisResponseDto, 'Resume AI analysis fetched successfully')
  async findByCandidateDocumentId(
    @Param('candidateDocumentId') candidateDocumentId: string,
  ) {
    const row =
      await this.resumeAiAnalysesService.findByCandidateDocumentId(candidateDocumentId);
    return ResponseUtil.success(
      'Resume AI analysis fetched successfully',
      AiInsightsMapper.toResumeAnalysisResponse(row),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List resume AI analyses (offset or cursor pagination)' })
  @ApiResumeAiAnalysesPaginatedResponse(
    ResumeAiAnalysisResponseDto,
    'Resume AI analyses fetched successfully',
  )
  async list(@Query() query: ListResumeAiAnalysesQueryDto) {
    const result = await this.resumeAiAnalysesService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Resume AI analyses fetched successfully', {
        data: result.data.map(AiInsightsMapper.toResumeAnalysisResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Resume AI analyses fetched successfully',
      result.data.map(AiInsightsMapper.toResumeAnalysisResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }
}
