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
import { CandidateSkillProficiencyLevel } from '../enums/candidate-skill-proficiency-level.enum';
import { CandidateEntity } from './candidate.entity';

@Entity({ name: 'candidate_skills' })
export class CandidateSkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidate_id: string;

  @Column({ type: 'uuid' })
  skill_id: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  years_of_experience: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  proficiency_level: CandidateSkillProficiencyLevel | null;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => CandidateEntity, (c) => c.skills)
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateEntity;

  @ManyToOne(() => SkillEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillEntity;
}
