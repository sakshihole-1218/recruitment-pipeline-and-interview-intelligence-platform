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

import { AiInterviewSessionEntity } from '../../aiInterviewSessions/entities/ai-interview-session.entity';
import { AiInterviewQuestionEntity } from '../../aiInterviewQuestions/entities/ai-interview-question.entity';

import { TranscriptSpeakerType } from '../enums/transcript-speaker-type.enum';

@Entity({ name: 'ai_interview_transcripts' })
@Index(
  'idx_ai_interview_transcripts_session_id_active',
  ['ai_interview_session_id'],
  {
    where: '"deleted_at" IS NULL',
  },
)
@Index(
  'idx_ai_interview_transcripts_question_id_active',
  ['ai_interview_question_id'],
  {
    where: '"deleted_at" IS NULL',
  },
)
@Index('idx_ai_interview_transcripts_speaker_type_active', ['speaker_type'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_ai_interview_transcripts_spoken_at_active', ['spoken_at'], {
  where: '"deleted_at" IS NULL',
})
@Index(
  'uq_ai_interview_transcripts_session_sequence_active',
  ['ai_interview_session_id', 'sequence_number'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class AiInterviewTranscriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ai_interview_session_id: string;

  @Column({ type: 'uuid', nullable: true })
  ai_interview_question_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  speaker_type: TranscriptSpeakerType;

  @Column({ type: 'text' })
  message_text: string;

  @Column({ type: 'int' })
  sequence_number: number;

  @Column({ type: 'timestamptz', nullable: true })
  spoken_at: Date | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  speech_to_text_confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  raw_payload: Record<string, unknown> | null;

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

  @ManyToOne(() => AiInterviewQuestionEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ai_interview_question_id' })
  ai_interview_question?: AiInterviewQuestionEntity | null;
}
