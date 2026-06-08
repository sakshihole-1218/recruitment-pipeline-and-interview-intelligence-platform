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
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { AiInterviewFeedbackEntity } from '../../aiInterviewFeedback/entities/ai-interview-feedback.entity';
import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';

@Entity({ name: 'interviewer_reviews' })
@Index(
  'uq_interviewer_reviews_session_reviewer_active',
  ['ai_interview_session_id', 'reviewer_user_id'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
@Index('idx_interviewer_reviews_application_id_active', ['application_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_interviewer_reviews_candidate_id_active', ['candidate_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_interviewer_reviews_status_active', ['review_status'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_interviewer_reviews_reviewed_at_active', ['reviewed_at'], {
  where: '"deleted_at" IS NULL',
})
export class InterviewerReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid', nullable: true })
  ai_interview_feedback_id: string | null;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'uuid' })
  reviewer_user_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  technical_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  communication_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  problem_solving_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  culture_fit_score: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  overall_score: string | null;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ type: 'text', nullable: true })
  concerns: string | null;

  @Column({ type: 'text', nullable: true })
  detailed_review: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  interviewer_recommendation: InterviewerRecommendation | null;

  @Column({ type: 'varchar', length: 20 })
  review_status: InterviewerReviewStatus;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

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

  @ManyToOne(() => AiInterviewFeedbackEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ai_interview_feedback_id' })
  ai_interview_feedback?: AiInterviewFeedbackEntity | null;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id' })
  candidate?: CandidateEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer?: UserEntity;
}
