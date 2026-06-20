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

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';

import { LivekitRoomStatus } from '../enums/livekit-room-status.enum';

@Entity({ name: 'livekit_room_sessions' })
@Index(
  'uq_livekit_room_sessions_ai_session_active',
  ['ai_interview_session_id'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
@Index('uq_livekit_room_sessions_room_name_active', ['room_name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_livekit_room_sessions_room_status_active', ['room_status'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_livekit_room_sessions_created_at_active', ['created_at'], {
  where: '"deleted_at" IS NULL',
})
export class LivekitRoomSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid' })
  interview_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'varchar', length: 255 })
  room_name: string;

  @Column({ type: 'varchar', length: 20 })
  room_status: LivekitRoomStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  candidate_identity: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ai_agent_identity: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  room_started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  room_ended_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_webhook_event_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

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

  @ManyToOne(() => InterviewEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'interview_id' })
  interview?: InterviewEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: CandidateEntity;
}
