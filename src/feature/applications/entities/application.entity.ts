import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ApplicationStageHistoryEntity } from './application-stage-history.entity';


@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  application_number: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'uuid' })
  job_opening_id: string;

  @Column({ type: 'timestamptz' })
  applied_at: Date;

  @Column({ type: 'varchar', length: 30 })
  current_stage: ApplicationCurrentStage;

  @Column({ type: 'varchar', length: 30 })
  application_status: ApplicationStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  screening_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  fit_score: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_recruiter_user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_hiring_manager_user_id: string | null;

  @Column({ type: 'boolean', default: false })
  is_priority: boolean;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'text', nullable: true })
  withdrawal_reason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_stage_changed_at: Date | null;

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

  @OneToMany(
    () => ApplicationStageHistoryEntity,
    (h: ApplicationStageHistoryEntity) => h.application,
  )
  stage_history: ApplicationStageHistoryEntity[];
}
