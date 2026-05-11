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

import { CandidateDocumentType } from '../enums/candidate-document-type.enum';
import { CandidateEntity } from './candidate.entity';

@Entity({ name: 'candidate_documents' })
export class CandidateDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'varchar', length: 30 })
  document_type: CandidateDocumentType;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mime_type: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  uploaded_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_latest: boolean;

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

  @ManyToOne(() => CandidateEntity, (c) => c.documents)
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateEntity;
}
