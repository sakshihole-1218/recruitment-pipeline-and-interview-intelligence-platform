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

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';

import { DifficultyLevel } from '../enums/difficulty-level.enum';
import { GeneratedFrom } from '../enums/generated-from.enum';
import { QuestionType } from '../enums/question-type.enum';

@Entity({ name: 'ai_interview_questions' })
@Index('idx_ai_interview_questions_session_id_active', ['ai_interview_session_id'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_ai_interview_questions_parent_id_active', ['parent_question_id'], {
  where: '"deleted_at" IS NULL',
})
@Index(
  'uq_ai_interview_questions_session_sequence_active',
  ['ai_interview_session_id', 'sequence_number'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class AiInterviewQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_question_id: string | null;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'varchar', length: 30 })
  question_type: QuestionType;

  @Column({ type: 'varchar', length: 150 })
  topic: string;

  @Column({ type: 'varchar', length: 20 })
  difficulty_level: DifficultyLevel;

  @Column({ type: 'int' })
  sequence_number: number;

  @Column({ type: 'boolean', default: false })
  is_follow_up: boolean;

  @Column({ type: 'varchar', length: 30 })
  generated_from: GeneratedFrom;

  @Column({ type: 'jsonb', nullable: true })
  expected_answer_keywords: string[] | null;

  @Column({ type: 'timestamptz', nullable: true })
  asked_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  answered_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_answered: boolean;

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

  @ManyToOne(() => AiInterviewQuestionEntity, (question) => question.follow_up_questions, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_question_id' })
  parent_question?: AiInterviewQuestionEntity | null;

  @OneToMany(() => AiInterviewQuestionEntity, (question) => question.parent_question)
  follow_up_questions?: AiInterviewQuestionEntity[];
}
