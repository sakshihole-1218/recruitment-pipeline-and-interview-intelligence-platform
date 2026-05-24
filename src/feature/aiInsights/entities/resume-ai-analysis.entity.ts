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

import { CandidateDocumentEntity } from '../../candidates/entities/candidate-document.entity';

import { ResumeAiAnalysisStatus } from '../enums/resume-ai-analysis-status.enum';

@Entity({ name: 'resume_ai_analyses' })
@Index(
  'uq_resume_ai_analyses_candidate_document_id_active',
  ['candidate_document_id'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class ResumeAiAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidate_document_id: string;

  @Column({ type: 'text' })
  extracted_text: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  skills_extracted: unknown;

  @Column({ type: 'text', nullable: true })
  experience_summary: string | null;

  @Column({ type: 'text', nullable: true })
  education_summary: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  ai_fit_score: string | null;

  @Column({ type: 'varchar', length: 30 })
  analysis_status: ResumeAiAnalysisStatus;

  @Column({ type: 'timestamptz', nullable: true })
  analyzed_at: Date | null;

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

  @ManyToOne(() => CandidateDocumentEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'candidate_document_id' })
  candidate_document?: CandidateDocumentEntity;
}
