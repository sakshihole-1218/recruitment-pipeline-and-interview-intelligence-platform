import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../../accessControl/entities/user.entity';
import { ActivityActionType } from '../enums/activity-action-type.enum';
import { ActivityEntityType } from '../enums/activity-entity-type.enum';

@Entity({ name: 'activity_logs' })
export class ActivityLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  entity_type: ActivityEntityType;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'varchar', length: 30 })
  action_type: ActivityActionType;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  action_by_user_id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  action_at: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'action_by_user_id' })
  action_by_user: UserEntity;
}
