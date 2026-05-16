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

import { UserEntity } from '../../accessControl/entities/user.entity';
import { InterviewPanelRole } from '../enums/interview-panel-role.enum';
import { InterviewEntity } from './interview.entity';

@Entity({ name: 'interview_panel_members' })
@Index('uq_interview_panel_members_interview_user', ['interview_id', 'user_id'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class InterviewPanelMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interview_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 30 })
  role_in_panel: InterviewPanelRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => InterviewEntity, (i) => i.panel_members, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'interview_id' })
  interview?: InterviewEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;
}
