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

import { AiFeedbackSummaryStatus } from '../enums/ai-feedback-summary-status.enum';
import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

@Entity({ name: 'feedback_ai_summaries' })
@Index('uq_feedback_ai_summaries_application_id_active', ['application_id'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class FeedbackAiSummaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'text' })
  summary_text: string;

  @Column({ type: 'text', nullable: true })
  strengths_summary: string | null;

  @Column({ type: 'text', nullable: true })
  concerns_summary: string | null;

  @Column({ type: 'text', nullable: true })
  technical_summary: string | null;

  @Column({ type: 'text', nullable: true })
  communication_summary: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  overall_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  technical_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  communication_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  problem_solving_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  culture_fit_score: string | null;

  @Column({ type: 'varchar', length: 30 })
  final_ai_recommendation: FinalAiRecommendation;

  @Column({ type: 'varchar', length: 30, nullable: true })
  generation_status: AiFeedbackSummaryStatus | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  generated_at: Date | null;

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

  @ManyToOne(() => ApplicationEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;
}
