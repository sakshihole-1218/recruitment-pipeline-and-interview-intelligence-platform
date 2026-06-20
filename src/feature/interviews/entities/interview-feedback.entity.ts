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
import { InterviewRecommendation } from '../enums/interview-recommendation.enum';
import { InterviewEntity } from './interview.entity';

@Entity({ name: 'interview_feedback' })
@Index(
  'uq_interview_feedback_interview_interviewer',
  ['interview_id', 'interviewer_user_id'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class InterviewFeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interview_id: string;

  @Column({ type: 'uuid' })
  interviewer_user_id: string;

  @Column({ type: 'int' })
  technical_score: number;

  @Column({ type: 'int' })
  communication_score: number;

  @Column({ type: 'int' })
  problem_solving_score: number;

  @Column({ type: 'int' })
  culture_fit_score: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  overall_score: string;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ type: 'text', nullable: true })
  concerns: string | null;

  @Column({ type: 'text', nullable: true })
  detailed_feedback: string | null;

  @Column({ type: 'varchar', length: 30 })
  recommendation: InterviewRecommendation;

  @Column({ type: 'timestamptz' })
  submitted_at: Date;

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

  @ManyToOne(() => InterviewEntity, (i) => i.feedbacks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'interview_id' })
  interview?: InterviewEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'interviewer_user_id' })
  interviewer?: UserEntity;
}
