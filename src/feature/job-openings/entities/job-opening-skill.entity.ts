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

import { SkillEntity } from '../../skills/entities/skill.entity';
import { SkillProficiencyLevel } from '../enums/skill-proficiency-level.enum';
import { JobOpeningEntity } from './job-opening.entity';

@Entity({ name: 'job_opening_skills' })
export class JobOpeningSkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_opening_id: string;

  @Column({ type: 'uuid' })
  skill_id: string;

  @Column({ type: 'varchar', length: 20 })
  proficiency_level: SkillProficiencyLevel;

  @Column({ type: 'boolean', default: true })
  is_mandatory: boolean;

  @Column({ type: 'int', nullable: true })
  years_of_experience_required: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => JobOpeningEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_opening_id' })
  job_opening: JobOpeningEntity;

  @ManyToOne(() => SkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill: SkillEntity;
}
