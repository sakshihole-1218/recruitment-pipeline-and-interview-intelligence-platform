import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';

import { CreateTranscriptEntryDto } from '../../dto/create-transcript-entry.dto';
import { TranscribeAnswerDto } from '../../dto/transcribe-answer.dto';
import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { TranscriptSpeakerType } from '../../enums/transcript-speaker-type.enum';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptsReferenceRepository } from '../../repositories/ai-interview-transcripts-reference.repository';
import {
  SPEECH_TO_TEXT_PROVIDER,
  SpeechToTextProvider,
} from '../../providers/speech-to-text-provider';
import { CreateTranscriptEntryUseCase } from './create-transcript-entry.usecase';

@Injectable()
export class TranscribeAnswerUseCase {
  constructor(
    private readonly referenceRepository: AiInterviewTranscriptsReferenceRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
    private readonly createTranscriptEntryUseCase: CreateTranscriptEntryUseCase,
    @Inject(SPEECH_TO_TEXT_PROVIDER)
    private readonly speechToTextProvider: SpeechToTextProvider,
  ) {}

  async execute(
    dto: TranscribeAnswerDto,
    file: Express.Multer.File | undefined,
    actorUserId?: string,
  ): Promise<AiInterviewTranscriptEntity> {
    this.validation.ensureActorUserRequired(actorUserId);
    this.validation.ensureAudioFileProvided(file);
    this.validation.ensureAudioFileType(file);

    const session = await this.referenceRepository.findSessionById(
      dto.ai_interview_session_id,
    );

    if (!session) {
      throw new NotFoundException({
        message: 'AI interview session not found',
        code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
      });
    }

    this.validation.ensureSessionAllowsCreate(session.session_status);

    const question = await this.referenceRepository.findQuestionById(
      dto.ai_interview_question_id,
    );

    if (!question) {
      throw new NotFoundException({
        message: 'AI interview question not found',
        code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
      });
    }

    this.validation.ensureQuestionBelongsToSession(question, session.id);

    const sttResult = await this.speechToTextProvider.transcribe({
      file,
      aiInterviewSessionId: session.id,
      aiInterviewQuestionId: question.id,
    });

    const transcriptText = String(sttResult.transcriptText ?? '').trim();
    if (!transcriptText) {
      throw new BadRequestException({
        message: 'Speech-to-text provider returned an empty transcript',
        code: 'STT_EMPTY_TRANSCRIPT',
      });
    }

    const createDto: CreateTranscriptEntryDto = {
      ai_interview_session_id: session.id,
      ai_interview_question_id: question.id,
      speaker_type: TranscriptSpeakerType.CANDIDATE,
      message_text: transcriptText,
      spoken_at: new Date(),
      speech_to_text_confidence: sttResult.confidence ?? undefined,
      raw_payload: sttResult.rawPayload ?? undefined,
    };

    return this.createTranscriptEntryUseCase.execute(createDto, actorUserId);
  }
}
