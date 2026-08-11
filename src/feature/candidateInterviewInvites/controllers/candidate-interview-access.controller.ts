import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { AiInterviewQuestionsMapper } from '../../aiInterviewQuestions/helpers/ai-interview-questions.mapper';
import { AiInterviewQuestionResponseDto } from '../../aiInterviewQuestions/dto/ai-interview-question.response.dto';
import { AiInterviewTranscriptsMapper } from '../../aiInterviewTranscripts/helpers/ai-interview-transcripts.mapper';
import { AiInterviewTranscriptResponseDto } from '../../aiInterviewTranscripts/dto/ai-interview-transcript.response.dto';
import { AiInterviewSessionsMapper } from '../../aiInterviewSessions/helpers/ai-interview-sessions.mapper';
import { AiInterviewSessionResponseDto } from '../../aiInterviewSessions/dto/ai-interview-session.response.dto';
import { CandidateInterviewInvitesService } from '../application/services/candidate-interview-invites.service';
import { CandidateInterviewAccessResponseDto } from '../dto/candidate-interview-access.response.dto';
import { CandidateCreateTranscriptEntryDto } from '../dto/candidate-create-transcript-entry.dto';
import { CandidateTranscribeAnswerDto } from '../dto/candidate-transcribe-answer.dto';
import { CandidateInterviewInvitesMapper } from '../helpers/candidate-interview-invites.mapper';

@ApiTags('Candidate Interview Access')
@Controller('candidate-interview-access')
export class CandidateInterviewAccessController {
  constructor(private readonly service: CandidateInterviewInvitesService) {}

  @Get(':token')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'token' })
  @ApiOperation({ summary: 'Validate candidate interview invite token' })
  @ApiStandardResponse(
    CandidateInterviewAccessResponseDto,
    'Candidate interview access validated successfully',
  )
  async validate(@Param('token') token: string) {
    const invite = await this.service.validate(token);
    return ResponseUtil.success(
      'Candidate interview access validated successfully',
      CandidateInterviewInvitesMapper.toAccessResponse(invite),
    );
  }

  @Post(':token/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start candidate AI interview using token access' })
  @ApiStandardResponse(
    AiInterviewSessionResponseDto,
    'Candidate interview started successfully',
  )
  async start(@Param('token') token: string) {
    const invite = await this.service.startCandidateInterview(token);
    return ResponseUtil.success(
      'Candidate interview started successfully',
      AiInterviewSessionsMapper.toResponse(invite!.ai_interview_session!),
    );
  }

  @Post(':token/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete candidate AI interview using token access' })
  async complete(@Param('token') token: string) {
    const invite = await this.service.completeCandidateInterview(token);
    return ResponseUtil.success(
      'Candidate interview completed successfully',
      CandidateInterviewInvitesMapper.toResponse(invite),
    );
  }

  @Get(':token/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get candidate AI interview questions' })
  async getQuestions(@Param('token') token: string) {
    const questions = await this.service.getQuestions(token);
    return ResponseUtil.success(
      'Candidate interview questions fetched successfully',
      questions.map(AiInterviewQuestionsMapper.toResponse),
    );
  }

  @Post(':token/questions/:questionId/follow-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate candidate AI interview follow-up question' })
  async generateFollowUp(
    @Param('token') token: string,
    @Param('questionId') questionId: string,
  ) {
    const question = await this.service.generateFollowUp(token, questionId);
    return ResponseUtil.success(
      'Candidate interview follow-up question generated successfully',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Patch(':token/questions/:questionId/mark-asked')
  @HttpCode(HttpStatus.OK)
  async markAsked(
    @Param('token') token: string,
    @Param('questionId') questionId: string,
  ) {
    const question = await this.service.markQuestionAsked(token, questionId);
    return ResponseUtil.success(
      'Candidate interview question marked as asked',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Patch(':token/questions/:questionId/mark-answered')
  @HttpCode(HttpStatus.OK)
  async markAnswered(
    @Param('token') token: string,
    @Param('questionId') questionId: string,
  ) {
    const question = await this.service.markQuestionAnswered(token, questionId);
    return ResponseUtil.success(
      'Candidate interview question marked as answered',
      AiInterviewQuestionsMapper.toResponse(question),
    );
  }

  @Get(':token/transcripts')
  @HttpCode(HttpStatus.OK)
  async getTranscripts(@Param('token') token: string) {
    const entries = await this.service.getTranscripts(token);
    return ResponseUtil.success(
      'Candidate interview transcript entries fetched successfully',
      entries.map(AiInterviewTranscriptsMapper.toResponse),
    );
  }

  @Post(':token/transcripts')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CandidateCreateTranscriptEntryDto })
  async createTranscript(
    @Param('token') token: string,
    @Body() dto: CandidateCreateTranscriptEntryDto,
  ) {
    const entry = await this.service.createTranscript(token, dto);
    return ResponseUtil.success(
      'Candidate interview transcript entry created successfully',
      AiInterviewTranscriptsMapper.toResponse(entry),
    );
  }

  @Post(':token/transcribe-answer')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ai_interview_question_id', 'audio'],
      properties: {
        ai_interview_question_id: { type: 'string', format: 'uuid' },
        audio: { type: 'string', format: 'binary' },
      },
    },
  })
  async transcribeAnswer(
    @Param('token') token: string,
    @Body() dto: CandidateTranscribeAnswerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const entry = await this.service.transcribeAnswer(token, dto, file);
    return ResponseUtil.success(
      'Candidate interview answer transcribed successfully',
      AiInterviewTranscriptsMapper.toResponse(entry),
    );
  }
}
