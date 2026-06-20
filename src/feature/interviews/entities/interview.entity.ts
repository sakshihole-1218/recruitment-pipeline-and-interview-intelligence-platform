import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { UserEntity } from '../../accessControl/entities/user.entity';
import { InterviewMode } from '../enums/interview-mode.enum';
import { InterviewStatus } from '../enums/interview-status.enum';

import { InterviewRoundEntity } from './interview-round.entity';
import { InterviewPanelMemberEntity } from './interview-panel-member.entity';
import { InterviewFeedbackEntity } from './interview-feedback.entity';

@Entity({ name: 'interviews' })
@Index(
  'uq_interviews_schedule_key_active',
  [
    'application_id',
    'interview_round_id',
    'scheduled_start_at',
    'scheduled_end_at',
  ],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class InterviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  interview_round_id: string;

  @Column({ type: 'timestamptz' })
  scheduled_start_at: Date;

  @Column({ type: 'timestamptz' })
  scheduled_end_at: Date;

  @Column({ type: 'varchar', length: 20 })
  interview_mode: InterviewMode;

  @Column({ type: 'text', nullable: true })
  meeting_link: string | null;

  @Column({ type: 'text', nullable: true })
  location_details: string | null;

  @Column({ type: 'varchar', length: 20 })
  interview_status: InterviewStatus;

  @Column({ type: 'uuid' })
  scheduled_by_user_id: string;

  @Column({ type: 'uuid', nullable: true })
  rescheduled_from_interview_id: string | null;

  @Column({ type: 'text', nullable: true })
  reschedule_reason: string | null;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

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

  @ManyToOne(() => InterviewRoundEntity, (r) => r.interviews, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'interview_round_id' })
  interview_round?: InterviewRoundEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'scheduled_by_user_id' })
  scheduled_by?: UserEntity;

  @ManyToOne(() => InterviewEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rescheduled_from_interview_id' })
  rescheduled_from?: InterviewEntity;

  @OneToMany(
    () => InterviewPanelMemberEntity,
    (m: InterviewPanelMemberEntity) => m.interview,
  )
  panel_members: InterviewPanelMemberEntity[];

  @OneToMany(
    () => InterviewFeedbackEntity,
    (f: InterviewFeedbackEntity) => f.interview,
  )
  feedbacks: InterviewFeedbackEntity[];
}
