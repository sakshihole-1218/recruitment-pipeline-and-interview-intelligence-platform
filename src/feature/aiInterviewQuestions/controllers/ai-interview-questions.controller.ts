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

import { AiInterviewQuestionsService } from '../application/services/ai-interview-questions.service';
import { ApiAiInterviewQuestionsArrayResponse } from '../decorators/api-ai-interview-questions-array-response.decorator';
import { ApiAiInterviewQuestionsPaginatedResponse } from '../decorators/api-ai-interview-questions-paginated-response.decorator';
import { AiInterviewQuestionQueryDto } from '../dto/ai-interview-question.query.dto';
import { AiInterviewQuestionResponseDto } from '../dto/ai-interview-question.response.dto';
import { CreateInterviewQuestionDto } from '../dto/create-interview-question.dto';
import { DeleteAiInterviewQuestionResponseDto } from '../dto/delete-ai-interview-question.response.dto';
import { GenerateInterviewPlanDto } from '../dto/generate-interview-plan.dto';
import { UpdateInterviewQuestionDto } from '../dto/update-interview-question.dto';
import { AiInterviewQuestionsMapper } from '../helpers/ai-interview-questions.mapper';

@ApiTags('AI Interview Questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-interview-questions')
export class AiInterviewQuestionsController {
  constructor(private readonly service: AiInterviewQuestionsService) {}

  @Post()
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a single AI interview question' })
  @ApiBody({ type: CreateInterviewQuestionDto })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question created successfully',
  )
  async create(
    @Body() dto: CreateInterviewQuestionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const question = await this.service.create(dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview question created successfully',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Post('generate-plan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Generate mocked interview plan questions for an AI interview session',
  })
  @ApiBody({ type: GenerateInterviewPlanDto })
  @ApiAiInterviewQuestionsArrayResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question plan generated successfully',
  )
  async generatePlan(
    @Body() dto: GenerateInterviewPlanDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const questions = await this.service.generatePlan(dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview question plan generated successfully',
      questions.map(AiInterviewQuestionsMapper.toResponse),
    );
  }

  @Post(':questionId/generate-follow-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate and store a Gemini follow-up question for a question',
  })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview follow-up question generated successfully',
  )
  async generateFollowUp(
    @Param('questionId') questionId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const question = await this.service.generateFollowUp(
      questionId,
      actor?.sub,
    );
    return ResponseUtil.success(
      'AI interview follow-up question generated successfully',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Patch(':id/mark-asked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark interview question as asked' })
  @ApiParam({ name: 'id', description: 'AI interview question UUID' })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question marked as asked',
  )
  async markAsked(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const question = await this.service.markAsked(id, actor?.sub);
    return ResponseUtil.success(
      'AI interview question marked as asked',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Patch(':id/mark-answered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark interview question as answered' })
  @ApiParam({ name: 'id', description: 'AI interview question UUID' })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question marked as answered',
  )
  async markAnswered(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const question = await this.service.markAnswered(id, actor?.sub);
    return ResponseUtil.success(
      'AI interview question marked as answered',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List AI interview questions with offset or cursor pagination',
  })
  @ApiAiInterviewQuestionsPaginatedResponse(
    AiInterviewQuestionResponseDto,
    'AI interview questions fetched successfully',
  )
  async list(@Query() query: AiInterviewQuestionQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'AI interview questions fetched successfully',
        {
          data: result.data.map(AiInterviewQuestionsMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'AI interview questions fetched successfully',
      result.data.map(AiInterviewQuestionsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all AI interview questions for a session' })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiAiInterviewQuestionsArrayResponse(
    AiInterviewQuestionResponseDto,
    'AI interview questions fetched successfully',
  )
  async getBySession(@Param('sessionId') sessionId: string) {
    const questions = await this.service.getBySession(sessionId);
    return ResponseUtil.success(
      'AI interview questions fetched successfully',
      questions.map(AiInterviewQuestionsMapper.toResponse),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI interview question by id' })
  @ApiParam({ name: 'id', description: 'AI interview question UUID' })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const question = await this.service.getById(id);
    return ResponseUtil.success(
      'AI interview question fetched successfully',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update AI interview question' })
  @ApiParam({ name: 'id', description: 'AI interview question UUID' })
  @ApiBody({ type: UpdateInterviewQuestionDto })
  @ApiStandardResponse(
    AiInterviewQuestionResponseDto,
    'AI interview question updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewQuestionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const question = await this.service.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview question updated successfully',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete AI interview question' })
  @ApiParam({ name: 'id', description: 'AI interview question UUID' })
  @ApiStandardResponse(
    DeleteAiInterviewQuestionResponseDto,
    'AI interview question deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success('AI interview question deleted successfully', {
      id,
    });
  }
}
