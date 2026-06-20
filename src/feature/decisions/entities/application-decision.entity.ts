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
import { UserEntity } from '../../accessControl/entities/user.entity';
import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { DecisionSource } from '../enums/decision-source.enum';
import { DecisionStatus } from '../enums/decision-status.enum';

@Entity({ name: 'application_decisions' })
@Index('uq_application_decisions_application_id_active', ['application_id'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_application_decisions_decision_status', ['decision_status'])
@Index('idx_application_decisions_decided_by_user_id', ['decided_by_user_id'])
@Index('idx_application_decisions_decision_at', ['decision_at'])
@Index('idx_application_decisions_decision_source', ['decision_source'])
@Index('idx_application_decisions_ai_interview_session_id', [
  'ai_interview_session_id',
])
@Index('idx_application_decisions_ai_interview_feedback_id', [
  'ai_interview_feedback_id',
])
export class ApplicationDecisionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'varchar', length: 30 })
  decision_status: DecisionStatus;

  @Column({ type: 'text', nullable: true })
  decision_reason: string | null;

  @Column({ type: 'text', nullable: true })
  decision_notes: string | null;

  @Column({ type: 'uuid' })
  decided_by_user_id: string;

  @Column({ type: 'uuid', nullable: true })
  ai_interview_session_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  ai_interview_feedback_id: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  decision_source: DecisionSource | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  final_score: string | null;

  @Column({ type: 'jsonb', nullable: true })
  ai_recommendation_snapshot: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  interviewer_recommendation_snapshot: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  proctoring_risk_snapshot: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  decision_at: Date;

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

  @ManyToOne(() => ApplicationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'decided_by_user_id' })
  decided_by?: UserEntity;

  @ManyToOne(() => AiInterviewSessionEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ai_interview_session_id' })
  ai_interview_session?: AiInterviewSessionEntity | null;

  @ManyToOne(() => AiInterviewFeedbackEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ai_interview_feedback_id' })
  ai_interview_feedback?: AiInterviewFeedbackEntity | null;
}
