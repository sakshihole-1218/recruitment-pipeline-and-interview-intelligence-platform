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

import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ResumeAiAnalysisEntity } from '../../aiInsights/entities/resume-ai-analysis.entity';

import { AiInterviewSessionStatus } from '../enums/ai-interview-session-status.enum';
import { QuestionGenerationStatus } from '../enums/question-generation-status.enum';
import { FeedbackGenerationStatus } from '../enums/feedback-generation-status.enum';

@Entity({ name: 'ai_interview_sessions' })
@Index('idx_ai_interview_sessions_interview_id_active', ['interview_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('uq_ai_interview_sessions_session_code_active', ['session_code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class AiInterviewSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interview_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'uuid', nullable: true })
  resume_analysis_id: string | null;

  @Column({ type: 'varchar', length: 40 })
  session_code: string;

  @Column({ type: 'varchar', length: 20 })
  session_status: AiInterviewSessionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  livekit_room_name: string | null;

  @Column({ type: 'varchar', length: 20 })
  question_generation_status: QuestionGenerationStatus;

  @Column({ type: 'varchar', length: 20 })
  feedback_generation_status: FeedbackGenerationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at: Date | null;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

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

  @ManyToOne(() => InterviewEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'interview_id' })
  interview?: InterviewEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: CandidateEntity;

  @ManyToOne(() => ResumeAiAnalysisEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resume_analysis_id' })
  resume_analysis?: ResumeAiAnalysisEntity;
}
