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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { ApiAiInterviewSessionsPaginatedResponse } from '../decorators/api-ai-interview-sessions-paginated-response.decorator';
import { ApiAiInterviewSessionsArrayResponse } from '../decorators/api-ai-interview-sessions-array-response.decorator';
import { AiInterviewSessionsService } from '../application/services/ai-interview-sessions.service';
import { CreateAiInterviewSessionDto } from '../dto/create-ai-interview-session.dto';
import { UpdateAiInterviewSessionDto } from '../dto/update-ai-interview-session.dto';
import { AiInterviewSessionQueryDto } from '../dto/ai-interview-session.query.dto';
import { AiInterviewSessionResponseDto } from '../dto/ai-interview-session.response.dto';
import { DeleteAiInterviewSessionResponseDto } from '../dto/delete-ai-interview-session.response.dto';
import { CancelAiInterviewSessionDto } from '../dto/cancel-ai-interview-session.dto';
import { MarkAiInterviewSessionFailedDto } from '../dto/mark-ai-interview-session-failed.dto';
import { AiInterviewSessionsMapper } from '../helpers/ai-interview-sessions.mapper';

@ApiTags('AI Interview Sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-interview-sessions')
export class AiInterviewSessionsController {
  constructor(private readonly service: AiInterviewSessionsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create AI interview session for a scheduled interview',
  })
  @ApiBody({ type: CreateAiInterviewSessionDto })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session created successfully',
  )
  async create(
    @Body() dto: CreateAiInterviewSessionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const session = await this.service.create(dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview session created successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start AI interview session' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session started successfully',
  )
  async start(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const session = await this.service.start(id, actor?.sub);
    return ResponseUtil.success(
      'AI interview session started successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End AI interview session' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session ended successfully',
  )
  async end(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const session = await this.service.end(id, actor?.sub);
    return ResponseUtil.success(
      'AI interview session ended successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel AI interview session' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiBody({ type: CancelAiInterviewSessionDto })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session cancelled successfully',
  )
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelAiInterviewSessionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const session = await this.service.cancel(
      id,
      dto?.failure_reason,
      actor?.sub,
    );
    return ResponseUtil.success(
      'AI interview session cancelled successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Post(':id/mark-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark AI interview session as failed' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiBody({ type: MarkAiInterviewSessionFailedDto })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session marked as failed',
  )
  async markFailed(
    @Param('id') id: string,
    @Body() dto: MarkAiInterviewSessionFailedDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const session = await this.service.markFailed(
      id,
      String(dto?.failure_reason || ''),
      actor?.sub,
    );

    return ResponseUtil.success(
      'AI interview session marked as failed',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List AI interview sessions (offset or cursor pagination)',
  })
  @ApiAiInterviewSessionsPaginatedResponse(
    AiInterviewSessionResponseDto,
    'AI interview sessions fetched successfully',
  )
  async list(@Query() query: AiInterviewSessionQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'AI interview sessions fetched successfully',
        {
          data: result.data.map(AiInterviewSessionsMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'AI interview sessions fetched successfully',
      result.data.map(AiInterviewSessionsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('interview/:interviewId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI interview sessions by interview id' })
  @ApiParam({ name: 'interviewId', description: 'Interview UUID' })
  @ApiAiInterviewSessionsArrayResponse(
    AiInterviewSessionResponseDto,
    'AI interview sessions fetched successfully',
  )
  async getByInterviewId(@Param('interviewId') interviewId: string) {
    const sessions = await this.service.getByInterviewId(interviewId);
    return ResponseUtil.success(
      'AI interview sessions fetched successfully',
      sessions.map(AiInterviewSessionsMapper.toResponse),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI interview session by id' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const session = await this.service.getById(id);
    return ResponseUtil.success(
      'AI interview session fetched successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update AI interview session (controlled)' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiBody({ type: UpdateAiInterviewSessionDto })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'AI interview session updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAiInterviewSessionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const session = await this.service.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview session updated successfully',
      AiInterviewSessionsMapper.toResponse(session),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete AI interview session' })
  @ApiParam({ name: 'id', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    DeleteAiInterviewSessionResponseDto,
    'AI interview session deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success('AI interview session deleted successfully', {
      id,
    });
  }
}
