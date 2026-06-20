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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

import { AiInterviewTranscriptsService } from '../application/services/ai-interview-transcripts.service';
import { ApiAiInterviewTranscriptsArrayResponse } from '../decorators/api-ai-interview-transcripts-array-response.decorator';
import { ApiAiInterviewTranscriptsPaginatedResponse } from '../decorators/api-ai-interview-transcripts-paginated-response.decorator';
import { AiInterviewTranscriptResponseDto } from '../dto/ai-interview-transcript.response.dto';
import { BulkCreateTranscriptEntriesDto } from '../dto/bulk-create-transcript-entries.dto';
import { CreateTranscriptEntryDto } from '../dto/create-transcript-entry.dto';
import { DeleteAiInterviewTranscriptResponseDto } from '../dto/delete-ai-interview-transcript.response.dto';
import { TranscribeAnswerDto } from '../dto/transcribe-answer.dto';
import { TranscriptQueryDto } from '../dto/transcript-query.dto';
import { UpdateTranscriptEntryDto } from '../dto/update-transcript-entry.dto';
import { AiInterviewTranscriptsMapper } from '../helpers/ai-interview-transcripts.mapper';

@ApiTags('AI Interview Transcripts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-interview-transcripts')
export class AiInterviewTranscriptsController {
  constructor(private readonly service: AiInterviewTranscriptsService) {}

  private static getMaxAudioUploadBytes(): number {
    const fallback = 15 * 1024 * 1024;
    const raw = Number(process.env.AI_INTERVIEW_AUDIO_MAX_BYTES);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a transcript entry for an AI interview session',
  })
  @ApiBody({ type: CreateTranscriptEntryDto })
  @ApiStandardResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entry created successfully',
  )
  async create(
    @Body() dto: CreateTranscriptEntryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const transcriptEntry = await this.service.create(dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview transcript entry created successfully',
      AiInterviewTranscriptsMapper.toResponse(transcriptEntry),
    );
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create transcript entries for an AI interview session',
  })
  @ApiBody({ type: BulkCreateTranscriptEntriesDto })
  @ApiAiInterviewTranscriptsArrayResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entries created successfully',
  )
  async bulkCreate(
    @Body() dto: BulkCreateTranscriptEntriesDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const transcriptEntries = await this.service.bulkCreate(dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview transcript entries created successfully',
      transcriptEntries.map(AiInterviewTranscriptsMapper.toResponse),
    );
  }

  @Post('transcribe-answer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Upload candidate audio answer and create transcript entry via STT',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: AiInterviewTranscriptsController.getMaxAudioUploadBytes(),
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'ai_interview_session_id',
        'ai_interview_question_id',
        'audio',
      ],
      properties: {
        ai_interview_session_id: {
          type: 'string',
          format: 'uuid',
        },
        ai_interview_question_id: {
          type: 'string',
          format: 'uuid',
        },
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiStandardResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview answer transcribed successfully',
  )
  async transcribeAnswer(
    @Body() dto: TranscribeAnswerDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const transcriptEntry = await this.service.transcribeAnswer(
      dto,
      file,
      actor?.sub,
    );
    return ResponseUtil.success(
      'AI interview answer transcribed successfully',
      AiInterviewTranscriptsMapper.toResponse(transcriptEntry),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List AI interview transcript entries with offset or cursor pagination',
  })
  @ApiAiInterviewTranscriptsPaginatedResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entries fetched successfully',
  )
  async list(@Query() query: TranscriptQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'AI interview transcript entries fetched successfully',
        {
          data: result.data.map(AiInterviewTranscriptsMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'AI interview transcript entries fetched successfully',
      result.data.map(AiInterviewTranscriptsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transcript entries by AI interview session id',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiAiInterviewTranscriptsArrayResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entries fetched successfully',
  )
  async getBySession(@Param('sessionId') sessionId: string) {
    const transcriptEntries = await this.service.getBySession(sessionId);
    return ResponseUtil.success(
      'AI interview transcript entries fetched successfully',
      transcriptEntries.map(AiInterviewTranscriptsMapper.toResponse),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI interview transcript entry by id' })
  @ApiParam({ name: 'id', description: 'AI interview transcript entry UUID' })
  @ApiStandardResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entry fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const transcriptEntry = await this.service.getById(id);
    return ResponseUtil.success(
      'AI interview transcript entry fetched successfully',
      AiInterviewTranscriptsMapper.toResponse(transcriptEntry),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update AI interview transcript entry' })
  @ApiParam({ name: 'id', description: 'AI interview transcript entry UUID' })
  @ApiBody({ type: UpdateTranscriptEntryDto })
  @ApiStandardResponse(
    AiInterviewTranscriptResponseDto,
    'AI interview transcript entry updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptEntryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const transcriptEntry = await this.service.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'AI interview transcript entry updated successfully',
      AiInterviewTranscriptsMapper.toResponse(transcriptEntry),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete AI interview transcript entry' })
  @ApiParam({ name: 'id', description: 'AI interview transcript entry UUID' })
  @ApiStandardResponse(
    DeleteAiInterviewTranscriptResponseDto,
    'AI interview transcript entry deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success(
      'AI interview transcript entry deleted successfully',
      { id },
    );
  }
}
