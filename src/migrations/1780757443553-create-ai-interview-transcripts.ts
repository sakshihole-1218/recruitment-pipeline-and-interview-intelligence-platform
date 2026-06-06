import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterviewTranscripts1780757443553 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_interview_transcripts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "ai_interview_question_id" uuid,
        "speaker_type" varchar(30) NOT NULL,
        "message_text" text NOT NULL,
        "sequence_number" int NOT NULL,
        "spoken_at" timestamptz,
        "speech_to_text_confidence" numeric(5,4),
        "raw_payload" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_ai_interview_transcripts_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_transcripts_question_id"
          FOREIGN KEY ("ai_interview_question_id") REFERENCES "ai_interview_questions"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_session_id" ON "ai_interview_transcripts" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_question_id" ON "ai_interview_transcripts" ("ai_interview_question_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_speaker_type" ON "ai_interview_transcripts" ("speaker_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_spoken_at" ON "ai_interview_transcripts" ("spoken_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_created_at" ON "ai_interview_transcripts" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_transcripts_deleted_at" ON "ai_interview_transcripts" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_interview_transcripts_session_sequence_active" ON "ai_interview_transcripts" ("ai_interview_session_id", "sequence_number") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ai_interview_transcripts";');
  }
}
