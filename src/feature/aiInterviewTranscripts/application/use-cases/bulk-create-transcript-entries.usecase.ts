import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AiInterviewSessionStatus } from '../../../aiInterviewSessions/enums/ai-interview-session-status.enum';
import { AiInterviewQuestionEntity } from '../../../aiInterviewQuestions/entities/ai-interview-question.entity';
import { QuestionStatus } from '../../../aiInterviewQuestions/enums/question-status.enum';

import {
  BulkCreateTranscriptEntriesDto,
  BulkCreateTranscriptEntryItemDto,
} from '../../dto/bulk-create-transcript-entries.dto';
import { AiInterviewTranscriptEntity } from '../../entities/ai-interview-transcript.entity';
import { TranscriptSpeakerType } from '../../enums/transcript-speaker-type.enum';
import { AiInterviewTranscriptsValidationHelper } from '../../helpers/ai-interview-transcripts-validation.helper';
import { AiInterviewTranscriptRepository } from '../../repositories/ai-interview-transcript.repository';
import { AiInterviewTranscriptsReferenceRepository } from '../../repositories/ai-interview-transcripts-reference.repository';

@Injectable()
export class BulkCreateTranscriptEntriesUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewTranscriptRepository,
    private readonly referenceRepository: AiInterviewTranscriptsReferenceRepository,
    private readonly validation: AiInterviewTranscriptsValidationHelper,
  ) {}

  async execute(
    dto: BulkCreateTranscriptEntriesDto,
    actorUserId?: string,
  ): Promise<AiInterviewTranscriptEntity[]> {
    this.validation.ensureActorUserRequired(actorUserId);
    this.validation.ensureBulkEntriesProvided(dto.entries.length);

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

        this.validation.ensureSessionAllowsBulkCreate(session.session_status);

        const questionIds = Array.from(
          new Set(
            dto.entries
              .map((entry) => entry.ai_interview_question_id)
              .filter((value): value is string => Boolean(value)),
          ),
        );

        const questions = await this.referenceRepository.findQuestionsByIds(
          questionIds,
          {
            manager,
            lockForUpdate: true,
          },
        );
        const questionsById = new Map(
          questions.map((question) => [question.id, question]),
        );

        for (const questionId of questionIds) {
          const question = questionsById.get(questionId);
          if (!question) {
            throw new NotFoundException({
              message: 'AI interview question not found',
              code: 'AI_INTERVIEW_QUESTION_NOT_FOUND',
              meta: { ai_interview_question_id: questionId },
            });
          }

          this.validation.ensureQuestionBelongsToSession(question, session.id);
        }

        let nextSequenceNumber = await this.repository.getNextSequenceNumber(
          session.id,
          {
            manager,
          },
        );

        const seenSequenceNumbers = new Set<number>();
        const payloads: Partial<AiInterviewTranscriptEntity>[] = [];

        for (const entry of dto.entries) {
          const sequenceNumber = entry.sequence_number ?? nextSequenceNumber++;

          if (seenSequenceNumbers.has(sequenceNumber)) {
            throw new ConflictException({
              message:
                'Duplicate sequence number provided in bulk transcript payload',
              code: 'TRANSCRIPT_BULK_DUPLICATE_SEQUENCE_NUMBER',
              meta: { sequence_number: sequenceNumber },
            });
          }

          seenSequenceNumbers.add(sequenceNumber);

          const exists = await this.repository.existsSequenceNumberForSession(
            session.id,
            sequenceNumber,
            { manager },
          );
          this.validation.ensureSequenceNumberAvailable(sequenceNumber, exists);

          payloads.push({
            ai_interview_session_id: session.id,
            ai_interview_question_id: entry.ai_interview_question_id ?? null,
            speaker_type: entry.speaker_type,
            message_text: entry.message_text.trim(),
            sequence_number: sequenceNumber,
            spoken_at: entry.spoken_at ?? null,
            speech_to_text_confidence: entry.speech_to_text_confidence ?? null,
            raw_payload: entry.raw_payload ?? null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          });
        }

        const createdEntries = await this.repository.createManyEntries(
          payloads,
          { manager },
        );

        await this.syncQuestionStates({
          entries: dto.entries,
          questionsById,
          actorUserId,
          manager,
        });

        return createdEntries.sort(
          (left, right) => left.sequence_number - right.sequence_number,
        );
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

  private async syncQuestionStates(options: {
    entries: BulkCreateTranscriptEntryItemDto[];
    questionsById: Map<string, AiInterviewQuestionEntity>;
    actorUserId: string;
    manager: EntityManager;
  }): Promise<void> {
    const updates = new Map<
      string,
      {
        question: AiInterviewQuestionEntity;
        askedAt?: Date;
        answeredAt?: Date;
        shouldMarkAnswered: boolean;
      }
    >();

    for (const entry of options.entries) {
      if (!entry.ai_interview_question_id) {
        continue;
      }

      const question = options.questionsById.get(
        entry.ai_interview_question_id,
      );
      if (!question) {
        continue;
      }

      const current =
        updates.get(question.id) ??
        ({ question, shouldMarkAnswered: false } as {
          question: AiInterviewQuestionEntity;
          askedAt?: Date;
          answeredAt?: Date;
          shouldMarkAnswered: boolean;
        });

      const effectiveTimestamp = entry.spoken_at ?? new Date();

      if (entry.speaker_type === TranscriptSpeakerType.AI_INTERVIEWER) {
        if (
          !current.askedAt ||
          effectiveTimestamp.getTime() < current.askedAt.getTime()
        ) {
          current.askedAt = effectiveTimestamp;
        }
      }

      if (entry.speaker_type === TranscriptSpeakerType.CANDIDATE) {
        if (
          !current.answeredAt ||
          effectiveTimestamp.getTime() < current.answeredAt.getTime()
        ) {
          current.answeredAt = effectiveTimestamp;
        }
        current.shouldMarkAnswered = true;
      }

      updates.set(question.id, current);
    }

    for (const {
      question,
      askedAt,
      answeredAt,
      shouldMarkAnswered,
    } of updates.values()) {
      let changed = false;

      if (askedAt && !question.asked_at) {
        question.asked_at = askedAt;
        question.question_status = QuestionStatus.ASKED;
        changed = true;
      }

      if (answeredAt && !question.answered_at) {
        question.answered_at = answeredAt;
        question.question_status = QuestionStatus.ANSWERED;
        changed = true;
      }

      if (shouldMarkAnswered && !question.is_answered) {
        question.is_answered = true;
        question.question_status = QuestionStatus.ANSWERED;
        changed = true;
      }

      if (changed) {
        question.updated_by_user_id = options.actorUserId;
        await this.referenceRepository.saveQuestion(question, options.manager);
      }
    }
  }
}
