import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';

import { InterviewStatus } from '../../../interviews/enums/interview-status.enum';
import { ResumeAiAnalysisStatus } from '../../../aiInsights/enums/resume-ai-analysis-status.enum';
import { InterviewEntity } from '../../../interviews/entities/interview.entity';

import { CreateAiInterviewSessionDto } from '../../dto/create-ai-interview-session.dto';
import { AiInterviewSessionEntity } from '../../entities/ai-interview-session.entity';
import { AiInterviewSessionStatus } from '../../enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../../enums/question-generation-status.enum';
import { FeedbackGenerationStatus } from '../../enums/feedback-generation-status.enum';
import { AiInterviewSessionRepository } from '../../repositories/ai-interview-session.repository';
import { AiInterviewSessionsReferenceRepository } from '../../repositories/ai-interview-sessions-reference.repository';
import { AiInterviewSessionsValidationHelper } from '../../helpers/ai-interview-sessions-validation.helper';

function generateSessionCodeCandidate(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  let code = '';
  for (let i = 0; i < bytes.length; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

@Injectable()
export class CreateAiInterviewSessionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: AiInterviewSessionRepository,
    private readonly referenceRepository: AiInterviewSessionsReferenceRepository,
    private readonly validation: AiInterviewSessionsValidationHelper,
  ) {}

  async execute(
    dto: CreateAiInterviewSessionDto,
    actorUserId?: string,
  ): Promise<AiInterviewSessionEntity> {
    this.validation.ensureActorUserRequired(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();

      const interview = await this.referenceRepository.findInterviewById(
        dto.interview_id,
        manager,
      );

      if (!interview) {
        throw new NotFoundException({
          message: 'Interview not found',
          code: 'INTERVIEW_NOT_FOUND',
        });
      }

      this.validation.ensureInterviewIsSchedulable(interview.interview_status);

      // Lock on interview row to avoid duplicate active session creation
      await manager
        .getRepository(InterviewEntity)
        .createQueryBuilder('interviews')
        .where('interviews.id = :id', { id: interview.id })
        .andWhere('interviews.deleted_at IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      const existingActive = await this.repository.findActiveByInterviewId(
        interview.id,
        { manager, lockForUpdate: true },
      );

      if (existingActive) {
        throw new ConflictException({
          message:
            'An active AI interview session already exists for this interview',
          code: 'AI_SESSION_DUPLICATE_ACTIVE_FOR_INTERVIEW',
          meta: { session_id: existingActive.id },
        });
      }

      const application = await this.referenceRepository.findApplicationById(
        interview.application_id,
        manager,
      );

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      const candidate = await this.referenceRepository.findCandidateById(
        application.candidate_id,
        manager,
      );

      if (!candidate) {
        throw new NotFoundException({
          message: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND',
        });
      }

      let resumeAnalysisId: string;

      if (dto.resume_analysis_id) {
        const resume = await this.referenceRepository.findResumeAnalysisById(
          dto.resume_analysis_id,
          manager,
        );

        if (!resume) {
          throw new NotFoundException({
            message: 'Resume analysis not found',
            code: 'RESUME_ANALYSIS_NOT_FOUND',
          });
        }

        if (resume.candidate_id !== candidate.id) {
          throw new BadRequestException({
            message: 'Resume analysis does not belong to the candidate',
            code: 'RESUME_ANALYSIS_CANDIDATE_MISMATCH',
            meta: { candidate_id: candidate.id },
          });
        }

        if (resume.application_id && resume.application_id !== application.id) {
          throw new BadRequestException({
            message:
              'Resume analysis does not belong to the application context',
            code: 'RESUME_ANALYSIS_APPLICATION_MISMATCH',
            meta: { application_id: application.id },
          });
        }

        if (resume.analysis_status !== ResumeAiAnalysisStatus.COMPLETED) {
          throw new BadRequestException({
            message:
              'Resume analysis must be COMPLETED to create an AI interview session',
            code: 'RESUME_ANALYSIS_NOT_COMPLETED',
            meta: { analysis_status: resume.analysis_status },
          });
        }

        resumeAnalysisId = resume.id;
      } else {
        const latestCompleted =
          await this.referenceRepository.findLatestCompletedResumeAnalysisByCandidateId(
            candidate.id,
            manager,
          );

        if (!latestCompleted) {
          throw new BadRequestException({
            message: 'No completed resume analysis found for candidate',
            code: 'RESUME_ANALYSIS_REQUIRED',
          });
        }

        resumeAnalysisId = latestCompleted.id;
      }

      let sessionCode: string | null = null;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidateCode = generateSessionCodeCandidate();
        const exists = await this.repository.checkSessionCodeExists(
          candidateCode,
          {
            manager,
          },
        );
        if (!exists) {
          sessionCode = candidateCode;
          break;
        }
      }

      if (!sessionCode) {
        throw new ConflictException({
          message: 'Could not generate a unique session code. Please retry',
          code: 'AI_SESSION_CODE_GENERATION_FAILED',
        });
      }

      try {
        return await this.repository.createSession(
          {
            interview_id: interview.id,
            application_id: application.id,
            candidate_id: candidate.id,
            resume_analysis_id: resumeAnalysisId,
            session_code: sessionCode,
            session_status: AiInterviewSessionStatus.READY,
            livekit_room_name: null,
            question_generation_status: QuestionGenerationStatus.PENDING,
            feedback_generation_status: FeedbackGenerationStatus.PENDING,
            started_at: null,
            ended_at: null,
            duration_seconds: null,
            failure_reason: null,
            created_by_user_id: actorUserId,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message: 'AI interview session code already exists. Please retry',
            code: 'AI_SESSION_CODE_CONFLICT',
          });
        }
        throw error;
      }
    });
  }
}
