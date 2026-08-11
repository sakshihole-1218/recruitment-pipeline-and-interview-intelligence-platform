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

import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { UserEntity } from '../../accessControl/entities/user.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { CandidateInterviewInviteStatus } from '../enums/candidate-interview-invite-status.enum';

@Entity({ name: 'candidate_interview_invites' })
@Index('idx_candidate_interview_invites_interview_id_active', ['interview_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_candidate_interview_invites_token_hash_active', ['token_hash'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index(
  'idx_candidate_interview_invites_public_token_active',
  ['public_token'],
  {
    unique: true,
    where: '"deleted_at" IS NULL AND "public_token" IS NOT NULL',
  },
)
export class CandidateInterviewInviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interview_id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'varchar', length: 128 })
  token_hash: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  public_token: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: CandidateInterviewInviteStatus;

  @Column({ type: 'timestamptz', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  first_accessed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_accessed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

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

  @ManyToOne(() => AiInterviewSessionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ai_interview_session_id' })
  ai_interview_session?: AiInterviewSessionEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: CandidateEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by?: UserEntity | null;
}
