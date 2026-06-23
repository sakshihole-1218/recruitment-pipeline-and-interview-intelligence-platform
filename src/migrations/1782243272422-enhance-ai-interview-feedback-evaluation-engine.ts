import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceAiInterviewFeedbackEvaluationEngine1782243272422 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "project_understanding_score" TO "experience_relevance_score";
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "ai_recommendation" TO "recommendation";
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "raw_ai_payload" TO "evaluation_metadata";
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      ADD COLUMN IF NOT EXISTS "strengths_summary" text,
      ADD COLUMN IF NOT EXISTS "weaknesses_summary" text,
      ADD COLUMN IF NOT EXISTS "detailed_feedback" text,
      ADD COLUMN IF NOT EXISTS "experience_relevance_summary" text;
    `);

    await queryRunner.query(`
      UPDATE "ai_interview_feedback"
      SET
        "technical_score" = CASE
          WHEN "technical_score" IS NOT NULL AND "technical_score" > 10
            THEN ROUND(("technical_score" / 10.0)::numeric, 2)
          ELSE "technical_score"
        END,
        "communication_score" = CASE
          WHEN "communication_score" IS NOT NULL AND "communication_score" > 10
            THEN ROUND(("communication_score" / 10.0)::numeric, 2)
          ELSE "communication_score"
        END,
        "problem_solving_score" = CASE
          WHEN "problem_solving_score" IS NOT NULL AND "problem_solving_score" > 10
            THEN ROUND(("problem_solving_score" / 10.0)::numeric, 2)
          ELSE "problem_solving_score"
        END,
        "experience_relevance_score" = CASE
          WHEN "experience_relevance_score" IS NOT NULL AND "experience_relevance_score" > 10
            THEN ROUND(("experience_relevance_score" / 10.0)::numeric, 2)
          ELSE "experience_relevance_score"
        END,
        "strengths_summary" = COALESCE("strengths_summary", "strengths"),
        "weaknesses_summary" = COALESCE(
          "weaknesses_summary",
          NULLIF(
            CONCAT_WS(E'\\n', NULLIF("concerns", ''), NULLIF("improvement_areas", '')),
            ''
          )
        ),
        "detailed_feedback" = COALESCE(
          "detailed_feedback",
          NULLIF(
            CONCAT_WS(
              E'\\n\\n',
              NULLIF("technical_summary", ''),
              NULLIF("communication_summary", ''),
              NULLIF("problem_solving_summary", ''),
              NULLIF("project_understanding_summary", '')
            ),
            ''
          )
        ),
        "experience_relevance_summary" = COALESCE(
          "experience_relevance_summary",
          "project_understanding_summary"
        );
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      DROP COLUMN IF EXISTS "answer_relevance_score",
      DROP COLUMN IF EXISTS "confidence_score",
      DROP COLUMN IF EXISTS "project_understanding_summary",
      DROP COLUMN IF EXISTS "strengths",
      DROP COLUMN IF EXISTS "concerns",
      DROP COLUMN IF EXISTS "improvement_areas";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interview_feedback_ai_recommendation";
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_recommendation_active"
      ON "ai_interview_feedback" ("recommendation")
      WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      ADD COLUMN IF NOT EXISTS "answer_relevance_score" numeric(5,2),
      ADD COLUMN IF NOT EXISTS "confidence_score" numeric(5,2),
      ADD COLUMN IF NOT EXISTS "project_understanding_summary" text,
      ADD COLUMN IF NOT EXISTS "strengths" text,
      ADD COLUMN IF NOT EXISTS "concerns" text,
      ADD COLUMN IF NOT EXISTS "improvement_areas" text;
    `);

    await queryRunner.query(`
      UPDATE "ai_interview_feedback"
      SET
        "project_understanding_summary" = COALESCE(
          "project_understanding_summary",
          "experience_relevance_summary"
        ),
        "strengths" = COALESCE("strengths", "strengths_summary"),
        "concerns" = COALESCE("concerns", "weaknesses_summary"),
        "improvement_areas" = COALESCE("improvement_areas", "detailed_feedback");
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interview_feedback_recommendation_active";
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      DROP COLUMN IF EXISTS "strengths_summary",
      DROP COLUMN IF EXISTS "weaknesses_summary",
      DROP COLUMN IF EXISTS "detailed_feedback",
      DROP COLUMN IF EXISTS "experience_relevance_summary";
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "experience_relevance_score" TO "project_understanding_score";
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "recommendation" TO "ai_recommendation";
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_feedback"
      RENAME COLUMN "evaluation_metadata" TO "raw_ai_payload";
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interview_feedback_ai_recommendation"
      ON "ai_interview_feedback" ("ai_recommendation");
    `);
  }

}
