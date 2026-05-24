import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInsightsTables1779612203296 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "resume_ai_analyses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_document_id" uuid NOT NULL,
        "extracted_text" text NOT NULL,
        "skills_extracted" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "experience_summary" text,
        "education_summary" text,
        "ai_fit_score" numeric(5,2),
        "analysis_status" varchar(30) NOT NULL,
        "analyzed_at" timestamptz,

        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_resume_ai_analyses_candidate_document_id"
          FOREIGN KEY ("candidate_document_id")
          REFERENCES "candidate_documents"("id")
          ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_resume_ai_analyses_candidate_document_id_active"
      ON "resume_ai_analyses" ("candidate_document_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_candidate_document_id" ON "resume_ai_analyses" ("candidate_document_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_analysis_status" ON "resume_ai_analyses" ("analysis_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_analyzed_at" ON "resume_ai_analyses" ("analyzed_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_created_at" ON "resume_ai_analyses" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_deleted_at" ON "resume_ai_analyses" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feedback_ai_summaries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "summary_text" text NOT NULL,
        "strengths_summary" text,
        "concerns_summary" text,
        "final_ai_recommendation" varchar(30) NOT NULL,
        "generated_at" timestamptz NOT NULL DEFAULT now(),

        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_feedback_ai_summaries_application_id"
          FOREIGN KEY ("application_id")
          REFERENCES "applications"("id")
          ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_feedback_ai_summaries_application_id_active"
      ON "feedback_ai_summaries" ("application_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_application_id" ON "feedback_ai_summaries" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_final_ai_recommendation" ON "feedback_ai_summaries" ("final_ai_recommendation");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_generated_at" ON "feedback_ai_summaries" ("generated_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_created_at" ON "feedback_ai_summaries" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_deleted_at" ON "feedback_ai_summaries" ("deleted_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "feedback_ai_summaries";');
    await queryRunner.query('DROP TABLE IF EXISTS "resume_ai_analyses";');
  }
}
