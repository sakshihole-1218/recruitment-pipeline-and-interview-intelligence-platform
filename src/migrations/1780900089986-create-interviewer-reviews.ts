import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewerReviews1780900089986 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interviewer_reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "ai_interview_feedback_id" uuid,
        "application_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "reviewer_user_id" uuid NOT NULL,
        "technical_score" numeric(5,2),
        "communication_score" numeric(5,2),
        "problem_solving_score" numeric(5,2),
        "culture_fit_score" numeric(5,2),
        "overall_score" numeric(5,2),
        "strengths" text,
        "concerns" text,
        "detailed_review" text,
        "interviewer_recommendation" varchar(30),
        "review_status" varchar(20) NOT NULL,
        "reviewed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_interviewer_reviews_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviewer_reviews_feedback_id"
          FOREIGN KEY ("ai_interview_feedback_id") REFERENCES "ai_interview_feedback"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_interviewer_reviews_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviewer_reviews_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviewer_reviews_reviewer_user_id"
          FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_interviewer_reviews_session_reviewer_active" ON "interviewer_reviews" ("ai_interview_session_id", "reviewer_user_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_session_id" ON "interviewer_reviews" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_feedback_id" ON "interviewer_reviews" ("ai_interview_feedback_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_application_id" ON "interviewer_reviews" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_candidate_id" ON "interviewer_reviews" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_reviewer_user_id" ON "interviewer_reviews" ("reviewer_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_review_status" ON "interviewer_reviews" ("review_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_interviewer_recommendation" ON "interviewer_reviews" ("interviewer_recommendation");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_reviewed_at" ON "interviewer_reviews" ("reviewed_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_created_at" ON "interviewer_reviews" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_deleted_at" ON "interviewer_reviews" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_application_active" ON "interviewer_reviews" ("application_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_candidate_active" ON "interviewer_reviews" ("candidate_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_review_status_active" ON "interviewer_reviews" ("review_status") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviewer_reviews_reviewed_at_active" ON "interviewer_reviews" ("reviewed_at") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "interviewer_reviews";');
  }
}
