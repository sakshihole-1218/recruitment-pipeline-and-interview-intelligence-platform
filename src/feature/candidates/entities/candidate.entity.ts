import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CandidateGender } from '../enums/candidate-gender.enum';
import { CandidateSourceType } from '../enums/candidate-source-type.enum';
import { CandidateSkillEntity } from './candidate-skill.entity';
import { CandidateDocumentEntity } from './candidate-document.entity';

@Entity({ name: 'candidates' })
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender: CandidateGender | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  total_experience_years: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  current_company: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  current_job_title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  current_location: string | null;

  @Column({ type: 'int', nullable: true })
  notice_period_days: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  current_salary: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  expected_salary: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency_code: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedin_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  github_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  portfolio_url: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  resume_headline: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  source_type: CandidateSourceType | null;

  @Column({ type: 'text', nullable: true })
  source_details: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

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
    () => CandidateSkillEntity,
    (skill: CandidateSkillEntity) => skill.candidate,
  )
  skills: CandidateSkillEntity[];

  @OneToMany(
    () => CandidateDocumentEntity,
    (document: CandidateDocumentEntity) => document.candidate,
  )
  documents: CandidateDocumentEntity[];
}
