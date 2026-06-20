import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

import { AiInterviewFeedbackStatus } from '../enums/ai-interview-feedback-status.enum';
import { AiInterviewRecommendation } from '../enums/ai-interview-recommendation.enum';

@Entity({ name: 'ai_interview_feedback' })
@Index(
  'uq_ai_interview_feedback_session_id_active',
  ['ai_interview_session_id'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
@Index('idx_ai_interview_feedback_application_id_active', ['application_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_ai_interview_feedback_candidate_id_active', ['candidate_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_ai_interview_feedback_status_active', ['feedback_status'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_ai_interview_feedback_generated_at_active', ['generated_at'], {
  where: '"deleted_at" IS NULL',
})
export class AiInterviewFeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'uuid', nullable: true })
  resume_analysis_id: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  technical_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  communication_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  problem_solving_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  project_understanding_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  answer_relevance_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidence_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  overall_score: string | null;

  @Column({ type: 'text', nullable: true })
  technical_summary: string | null;

  @Column({ type: 'text', nullable: true })
  communication_summary: string | null;

  @Column({ type: 'text', nullable: true })
  problem_solving_summary: string | null;

  @Column({ type: 'text', nullable: true })
  project_understanding_summary: string | null;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ type: 'text', nullable: true })
  concerns: string | null;

  @Column({ type: 'text', nullable: true })
  improvement_areas: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  ai_recommendation: AiInterviewRecommendation | null;

  @Column({ type: 'varchar', length: 20 })
  feedback_status: AiInterviewFeedbackStatus;

  @Column({ type: 'timestamptz', nullable: true })
  generated_at: Date | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  raw_ai_payload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  created_by_user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by_user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  deleted_by_user_id: string | null;

  @ManyToOne(() => AiInterviewSessionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ai_interview_session_id' })
  ai_interview_session?: AiInterviewSessionEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: CandidateEntity;

  @ManyToOne(() => ResumeAiAnalysisEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'resume_analysis_id' })
  resume_analysis?: ResumeAiAnalysisEntity | null;
}
