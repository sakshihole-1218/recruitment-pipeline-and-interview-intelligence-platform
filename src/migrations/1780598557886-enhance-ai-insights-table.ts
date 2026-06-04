import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceAiInsightsTable1780598557886 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // resume_ai_analyses
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "candidate_id" uuid;`,
    );

    // Backfill candidate_id from candidate_documents for existing rows
    await queryRunner.query(`
      UPDATE "resume_ai_analyses" r
      SET "candidate_id" = d."candidate_id"
      FROM "candidate_documents" d
      WHERE d."id" = r."candidate_document_id"
        AND r."candidate_id" IS NULL;
    `);

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ALTER COLUMN "candidate_id" SET NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "application_id" uuid;`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "parsed_resume_json" jsonb;`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ALTER COLUMN "extracted_text" DROP NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "project_summary" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "certification_summary" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "total_experience_years_detected" numeric(10,2);`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ADD COLUMN IF NOT EXISTS "failure_reason" text;`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_candidate_id" ON "resume_ai_analyses" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_resume_ai_analyses_application_id" ON "resume_ai_analyses" ("application_id");`,
    );

    // feedback_ai_summaries
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "technical_summary" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "communication_summary" text;`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "overall_score" numeric(5,2);`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "technical_score" numeric(5,2);`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "communication_score" numeric(5,2);`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "problem_solving_score" numeric(5,2);`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "culture_fit_score" numeric(5,2);`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "failure_reason" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ADD COLUMN IF NOT EXISTS "generation_status" varchar(30);`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ALTER COLUMN "generated_at" DROP NOT NULL;`,
    );

    // Backfill status for existing rows
    await queryRunner.query(`
      UPDATE "feedback_ai_summaries"
      SET "generation_status" = 'COMPLETED'
      WHERE "generation_status" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_feedback_ai_summaries_generation_status" ON "feedback_ai_summaries" ("generation_status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_feedback_ai_summaries_generation_status";`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" ALTER COLUMN "generated_at" SET NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "generation_status";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "failure_reason";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "culture_fit_score";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "problem_solving_score";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "communication_score";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "technical_score";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "overall_score";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "communication_summary";`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_ai_summaries" DROP COLUMN IF EXISTS "technical_summary";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_resume_ai_analyses_application_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_resume_ai_analyses_candidate_id";`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "failure_reason";`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "total_experience_years_detected";`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "certification_summary";`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "project_summary";`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" ALTER COLUMN "extracted_text" SET NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "parsed_resume_json";`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "application_id";`,
    );

    await queryRunner.query(
      `ALTER TABLE "resume_ai_analyses" DROP COLUMN IF EXISTS "candidate_id";`,
    );
  }
}
