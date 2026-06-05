import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterviewSessionsTable1780665985668 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_interview_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "interview_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "resume_analysis_id" uuid,
        "session_code" varchar(40) NOT NULL,
        "session_status" varchar(20) NOT NULL,
        "livekit_room_name" varchar(255),
        "question_generation_status" varchar(20) NOT NULL,
        "feedback_generation_status" varchar(20) NOT NULL,
        "started_at" timestamptz,
        "ended_at" timestamptz,
        "duration_seconds" int,
        "failure_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_ai_interview_sessions_interview_id"
          FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_sessions_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_sessions_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_sessions_resume_analysis_id"
          FOREIGN KEY ("resume_analysis_id") REFERENCES "resume_ai_analyses"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_interview_id" ON "ai_interview_sessions" ("interview_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_application_id" ON "ai_interview_sessions" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_candidate_id" ON "ai_interview_sessions" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_resume_analysis_id" ON "ai_interview_sessions" ("resume_analysis_id");`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_session_status" ON "ai_interview_sessions" ("session_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_question_generation_status" ON "ai_interview_sessions" ("question_generation_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_feedback_generation_status" ON "ai_interview_sessions" ("feedback_generation_status");`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_started_at" ON "ai_interview_sessions" ("started_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_created_at" ON "ai_interview_sessions" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_sessions_deleted_at" ON "ai_interview_sessions" ("deleted_at");`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_interview_sessions_session_code_active" ON "ai_interview_sessions" ("session_code") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ai_interview_sessions";');
  }
}
