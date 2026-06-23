import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { AiInterviewQuestionEntity } from '../../../aiInterviewQuestions/entities/ai-interview-question.entity';
import { QuestionStatus } from '../../../aiInterviewQuestions/enums/question-status.enum';

import { CreateTranscriptEntryDto } from '../../dto/create-transcript-entry.dto';
import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { TranscriptSpeakerType } from '../../enums/transcript-speaker-type.enum';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';
import { AiInterviewTranscriptsReferenceRepository } from '../../repositories/ai-interview-transcripts-reference.repository';

@Injectable()
export class CreateTranscriptEntryUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly referenceRepository: AiInterviewTranscriptsReferenceRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
  ) {}

  async execute(
    dto: CreateTranscriptEntryDto,
    actorUserId?: string,
  ): Promise<AiInterviewTranscriptEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const session = await this.referenceRepository.findSessionById(
          dto.ai_interview_session_id,
          {
            manager,
            lockForUpdate: true,
          },
        );

        if (!session) {
          throw new NotFoundException({
            message: 'AI interview session not found',
            code: 'AI_INTERVIEW_SESSION_NOT_FOUND',
          });
        }

        this.validation.ensureSessionAllowsCreate(session.session_status);

        let question: AiInterviewQuestionEntity | null = null;
        if (dto.ai_interview_question_id) {
          question = await this.referenceRepository.findQuestionById(
            dto.ai_interview_question_id,
            {
              manager,
              lockForUpdate: true,
            },
          );

          if (!question) {
            throw new NotFoundException({
              message: 'AI interview question not found',
              code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
            });
          }

          this.validation.ensureQuestionBelongsToSession(question, session.id);
        }

        const sequenceNumber =
          dto.sequence_number ??
          (await this.repository.getNextSequenceNumber(session.id, {
            manager,
          }));

        if (dto.sequence_number) {
          const exists = await this.repository.existsSequenceNumberForSession(
            session.id,
            sequenceNumber,
            { manager },
          );
          this.validation.ensureSequenceNumberAvailable(sequenceNumber, exists);
        }

        const entry = await this.repository.createEntry(
          {
            ai_interview_session_id: session.id,
            ai_interview_question_id: question?.id ?? null,
            speaker_type: dto.speaker_type,
            message_text: dto.message_text.trim(),
            sequence_number: sequenceNumber,
            spoken_at: dto.spoken_at ?? null,
            speech_to_text_confidence: dto.speech_to_text_confidence ?? null,
            raw_payload: dto.raw_payload ?? null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );

        await this.syncQuestionState({
          question,
          speakerType: dto.speaker_type,
          spokenAt: dto.spoken_at,
          actorUserId,
          manager,
        });

        return entry;
      });
    } catch (error: any) {
      if (String(error?.code) === '23505') {
        throw new ConflictException({
          message:
            'Sequence number already exists in this AI interview session',
          code: 'TRANSCRIPT_SEQUENCE_NUMBER_CONFLICT',
        });
      }
      throw error;
    }
  }

  private async syncQuestionState(options: {
    question: AiInterviewQuestionEntity | null;
    speakerType: TranscriptSpeakerType;
    spokenAt?: Date;
    actorUserId: string;
    manager: EntityManager;
  }): Promise<void> {
    if (!options.question) {
      return;
    }

    const effectiveTimestamp = options.spokenAt ?? new Date();

    if (options.speakerType === TranscriptSpeakerType.AI_INTERVIEWER) {
      options.question.asked_at =
        options.question.asked_at ?? effectiveTimestamp;
      options.question.question_status = QuestionStatus.ASKED;
      options.question.updated_by_user_id = options.actorUserId;
      await this.referenceRepository.saveQuestion(
        options.question,
        options.manager,
      );
      return;
    }

    if (options.speakerType === TranscriptSpeakerType.CANDIDATE) {
      options.question.asked_at =
        options.question.asked_at ?? effectiveTimestamp;
      options.question.answered_at =
        options.question.answered_at ?? effectiveTimestamp;
      options.question.is_answered = true;
      options.question.question_status = QuestionStatus.ANSWERED;
      options.question.updated_by_user_id = options.actorUserId;
      await this.referenceRepository.saveQuestion(
        options.question,
        options.manager,
      );
    }
  }
}
