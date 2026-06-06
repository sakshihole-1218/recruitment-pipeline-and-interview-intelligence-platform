import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterviewQuestions1780747601416 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_interview_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "parent_question_id" uuid,
        "question_text" text NOT NULL,
        "question_type" varchar(30) NOT NULL,
        "topic" varchar(150) NOT NULL,
        "difficulty_level" varchar(20) NOT NULL,
        "sequence_number" int NOT NULL,
        "is_follow_up" boolean NOT NULL DEFAULT false,
        "generated_from" varchar(30) NOT NULL,
        "expected_answer_keywords" jsonb,
        "asked_at" timestamptz,
        "answered_at" timestamptz,
        "is_answered" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_ai_interview_questions_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_questions_parent_question_id"
          FOREIGN KEY ("parent_question_id") REFERENCES "ai_interview_questions"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_session_id" ON "ai_interview_questions" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_parent_question_id" ON "ai_interview_questions" ("parent_question_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_question_type" ON "ai_interview_questions" ("question_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_difficulty_level" ON "ai_interview_questions" ("difficulty_level");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_generated_from" ON "ai_interview_questions" ("generated_from");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_asked_at" ON "ai_interview_questions" ("asked_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_answered_at" ON "ai_interview_questions" ("answered_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_created_at" ON "ai_interview_questions" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_deleted_at" ON "ai_interview_questions" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_interview_questions_session_sequence_active" ON "ai_interview_questions" ("ai_interview_session_id", "sequence_number") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ai_interview_questions";');
  }
}
