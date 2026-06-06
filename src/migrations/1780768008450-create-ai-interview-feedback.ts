import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterviewFeedback1780768008450 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_interview_feedback" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "resume_analysis_id" uuid,
        "technical_score" numeric(5,2),
        "communication_score" numeric(5,2),
        "problem_solving_score" numeric(5,2),
        "project_understanding_score" numeric(5,2),
        "answer_relevance_score" numeric(5,2),
        "confidence_score" numeric(5,2),
        "overall_score" numeric(5,2),
        "technical_summary" text,
        "communication_summary" text,
        "problem_solving_summary" text,
        "project_understanding_summary" text,
        "strengths" text,
        "concerns" text,
        "improvement_areas" text,
        "ai_recommendation" varchar(30),
        "feedback_status" varchar(20) NOT NULL,
        "generated_at" timestamptz,
        "failure_reason" text,
        "raw_ai_payload" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_ai_interview_feedback_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_feedback_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_feedback_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_ai_interview_feedback_resume_analysis_id"
          FOREIGN KEY ("resume_analysis_id") REFERENCES "resume_ai_analyses"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_interview_feedback_session_id_active" ON "ai_interview_feedback" ("ai_interview_session_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_application_id" ON "ai_interview_feedback" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_candidate_id" ON "ai_interview_feedback" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_feedback_status" ON "ai_interview_feedback" ("feedback_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_ai_recommendation" ON "ai_interview_feedback" ("ai_recommendation");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_generated_at" ON "ai_interview_feedback" ("generated_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_created_at" ON "ai_interview_feedback" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_deleted_at" ON "ai_interview_feedback" ("deleted_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ai_interview_feedback";');
  }
}
