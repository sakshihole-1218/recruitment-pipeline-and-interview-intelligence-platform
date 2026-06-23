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

import { AiInterviewFeedbackService } from '../application/services/ai-interview-feedback.service';
import { ApiAiInterviewFeedbackPaginatedResponse } from '../decorators/api-ai-interview-feedback-paginated-response.decorator';
import { AiInterviewFeedbackQueryDto } from '../dto/ai-interview-feedback.query.dto';
import { AiInterviewFeedbackResponseDto } from '../dto/ai-interview-feedback.response.dto';
import { DeleteAiInterviewFeedbackResponseDto } from '../dto/delete-ai-interview-feedback.response.dto';
import { UpdateAiInterviewFeedbackDto } from '../dto/update-ai-interview-feedback.dto';
import { AiInterviewFeedbackMapper } from '../helpers/ai-interview-feedback.mapper';

@ApiTags('AI Interview Feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-interview-feedback')
export class AiInterviewFeedbackController {
  constructor(private readonly service: AiInterviewFeedbackService) {}

  @Post('generate/:sessionId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate AI interview evaluation for a completed session',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback generated successfully',
  )
  async generate(
    @Param('sessionId') sessionId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const feedback = await this.service.generate(sessionId, actor?.sub);
    return ResponseUtil.success(
      'AI interview feedback generated successfully',
      AiInterviewFeedbackMapper.toResponse(feedback),
    );
  }

  @Post('regenerate/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate AI interview feedback for a session' })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback regenerated successfully',
  )
  async regenerate(
    @Param('sessionId') sessionId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const feedback = await this.service.regenerate(sessionId, actor?.sub);
    return ResponseUtil.success(
      'AI interview feedback regenerated successfully',
      AiInterviewFeedbackMapper.toResponse(feedback),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List AI interview feedback with offset or cursor pagination',
  })
  @ApiAiInterviewFeedbackPaginatedResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback fetched successfully',
  )
  async list(@Query() query: AiInterviewFeedbackQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'AI interview feedback fetched successfully',
        {
          data: result.data.map(AiInterviewFeedbackMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'AI interview feedback fetched successfully',
      result.data.map(AiInterviewFeedbackMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI interview feedback by AI interview session id',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback fetched successfully',
  )
  async getBySession(@Param('sessionId') sessionId: string) {
    const feedback = await this.service.getBySession(sessionId);
    return ResponseUtil.success(
      'AI interview feedback fetched successfully',
      AiInterviewFeedbackMapper.toResponse(feedback),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI interview feedback by id' })
  @ApiParam({ name: 'id', description: 'AI interview feedback UUID' })
  @ApiStandardResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const feedback = await this.service.getById(id);
    return ResponseUtil.success(
      'AI interview feedback fetched successfully',
      AiInterviewFeedbackMapper.toResponse(feedback),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update AI interview feedback' })
  @ApiParam({ name: 'id', description: 'AI interview feedback UUID' })
  @ApiBody({ type: UpdateAiInterviewFeedbackDto })
  @ApiStandardResponse(
    AiInterviewFeedbackResponseDto,
    'AI interview feedback updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAiInterviewFeedbackDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const feedback = await this.service.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview feedback updated successfully',
      AiInterviewFeedbackMapper.toResponse(feedback),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete AI interview feedback' })
  @ApiParam({ name: 'id', description: 'AI interview feedback UUID' })
  @ApiStandardResponse(
    DeleteAiInterviewFeedbackResponseDto,
    'AI interview feedback deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success('AI interview feedback deleted successfully', {
      id,
    });
  }
}
