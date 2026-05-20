import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationCurrentStage } from '../enums/application-current-stage.enum';
import { ApplicationEntity } from './application.entity';

@Entity({ name: 'application_stage_history' })
export class ApplicationStageHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  from_stage: ApplicationCurrentStage | null;

  @Column({ type: 'varchar', length: 30 })
  to_stage: ApplicationCurrentStage;

  @Column({ type: 'uuid' })
  changed_by_user_id: string;

  @Column({ type: 'text', nullable: true })
  change_reason: string | null;

  @Column({ type: 'timestamptz' })
  changed_at: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => ApplicationEntity, (a: ApplicationEntity) => a.stage_history, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'application_id' })
  application: ApplicationEntity;
}
