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
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

import { ProctoringEventType } from '../enums/proctoring-event-type.enum';
import { ProctoringSeverity } from '../enums/proctoring-severity.enum';

@Entity({ name: 'interview_proctoring_events' })
@Index(
  'idx_interview_proctoring_events_session_active',
  ['ai_interview_session_id'],
  {
    where: '"deleted_at" IS NULL',
  },
)
@Index(
  'idx_interview_proctoring_events_application_active',
  ['application_id'],
  {
    where: '"deleted_at" IS NULL',
  },
)
@Index('idx_interview_proctoring_events_candidate_active', ['candidate_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_interview_proctoring_events_occurred_at_active', ['occurred_at'], {
  where: '"deleted_at" IS NULL',
})
export class InterviewProctoringEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'varchar', length: 50 })
  event_type: ProctoringEventType;

  @Column({ type: 'varchar', length: 20 })
  severity: ProctoringSeverity;

  @Column({ type: 'text' })
  event_message: string;

  @Column({ type: 'jsonb', nullable: true })
  event_metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  occurred_at: Date;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'boolean', default: false })
  is_resolved: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resolved_by_user_id: string | null;

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
}
