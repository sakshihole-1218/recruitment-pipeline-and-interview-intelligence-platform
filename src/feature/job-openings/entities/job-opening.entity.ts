import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EmploymentType } from '../enums/employment-type.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { JobOpeningStatus } from '../enums/job-opening-status.enum';
import { JobOpeningSkillEntity } from './job-opening-skill.entity';

@Entity({ name: 'job_openings' })
export class JobOpeningEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'uuid' })
  department_id: string;

  @Column({ type: 'uuid' })
  hiring_manager_user_id: string;

  @Column({ type: 'uuid' })
  recruiter_user_id: string;

  @Column({ type: 'varchar', length: 30 })
  employment_type: EmploymentType;

  @Column({ type: 'varchar', length: 20 })
  work_mode: WorkMode;

  @Column({ type: 'int', nullable: true })
  experience_min_years: number | null;

  @Column({ type: 'int', nullable: true })
  experience_max_years: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  min_salary: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  max_salary: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency_code: string | null;

  @Column({ type: 'int' })
  openings_count: number;

  @Column({ type: 'text', nullable: true })
  job_description: string | null;

  @Column({ type: 'text', nullable: true })
  responsibilities: string | null;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 30 })
  status: JobOpeningStatus;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date | null;

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
    () => JobOpeningSkillEntity,
    (jos: JobOpeningSkillEntity) => jos.job_opening,
  )
  job_opening_skills: JobOpeningSkillEntity[];
}
