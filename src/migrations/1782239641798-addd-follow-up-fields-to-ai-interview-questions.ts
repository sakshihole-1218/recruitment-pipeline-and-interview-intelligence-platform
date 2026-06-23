import { MigrationInterface, QueryRunner } from "typeorm";

export class AdddFollowUpFieldsToAiInterviewQuestions1782239641798 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_interview_questions"
      ADD COLUMN IF NOT EXISTS "question_source" varchar(20) NOT NULL DEFAULT 'SYSTEM',
      ADD COLUMN IF NOT EXISTS "question_status" varchar(20) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "follow_up_reasoning" text;
    `);

    await queryRunner.query(`
      UPDATE "ai_interview_questions"
      SET
        "question_source" = CASE
          WHEN "is_follow_up" = true THEN 'FOLLOW_UP'
          ELSE 'SYSTEM'
        END,
        "question_status" = CASE
          WHEN "is_answered" = true OR "answered_at" IS NOT NULL THEN 'ANSWERED'
          WHEN "asked_at" IS NOT NULL THEN 'ASKED'
          ELSE 'PENDING'
        END
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_question_source"
      ON "ai_interview_questions" ("question_source");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interview_questions_question_status"
      ON "ai_interview_questions" ("question_status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interview_questions_question_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interview_questions_question_source";
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_interview_questions"
      DROP COLUMN IF EXISTS "follow_up_reasoning",
      DROP COLUMN IF EXISTS "question_status",
      DROP COLUMN IF EXISTS "question_source";
    `);
  }

}
