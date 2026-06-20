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

import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { InterviewRoundType } from '../enums/interview-round-type.enum';
import { InterviewEntity } from './interview.entity';

@Entity({ name: 'interview_rounds' })
@Index(
  'uq_interview_rounds_job_opening_sequence',
  ['job_opening_id', 'sequence_number'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class InterviewRoundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_opening_id: string;

  @Column({ type: 'varchar', length: 150 })
  round_name: string;

  @Column({ type: 'varchar', length: 30 })
  round_type: InterviewRoundType;

  @Column({ type: 'int' })
  sequence_number: number;

  @Column({ type: 'boolean', default: true })
  is_mandatory: boolean;

  @Column({ type: 'int', nullable: true })
  max_score: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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

  @ManyToOne(() => JobOpeningEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_opening_id' })
  job_opening?: JobOpeningEntity;

  @OneToMany(() => InterviewEntity, (i) => i.interview_round)
  interviews: InterviewEntity[];
}
