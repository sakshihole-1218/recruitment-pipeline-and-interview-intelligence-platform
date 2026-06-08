import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceApplicationDecisionsForAiWorkflow1780905838219 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "application_decisions"
      ADD COLUMN IF NOT EXISTS "decision_notes" text,
      ADD COLUMN IF NOT EXISTS "ai_interview_session_id" uuid,
      ADD COLUMN IF NOT EXISTS "ai_interview_feedback_id" uuid,
      ADD COLUMN IF NOT EXISTS "decision_source" varchar(30),
      ADD COLUMN IF NOT EXISTS "final_score" numeric(5,2),
      ADD COLUMN IF NOT EXISTS "ai_recommendation_snapshot" jsonb,
      ADD COLUMN IF NOT EXISTS "interviewer_recommendation_snapshot" jsonb,
      ADD COLUMN IF NOT EXISTS "proctoring_risk_snapshot" jsonb;
    `);

    await queryRunner
      .query(
        `
      ALTER TABLE "application_decisions"
      ADD CONSTRAINT "fk_application_decisions_ai_interview_session_id"
      FOREIGN KEY ("ai_interview_session_id")
      REFERENCES "ai_interview_sessions"("id")
      ON DELETE SET NULL;
    `,
      )
      .catch(() => undefined);

    await queryRunner
      .query(
        `
      ALTER TABLE "application_decisions"
      ADD CONSTRAINT "fk_application_decisions_ai_interview_feedback_id"
      FOREIGN KEY ("ai_interview_feedback_id")
      REFERENCES "ai_interview_feedback"("id")
      ON DELETE SET NULL;
    `,
      )
      .catch(() => undefined);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_ai_interview_session_id" ON "application_decisions" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_ai_interview_feedback_id" ON "application_decisions" ("ai_interview_feedback_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_decision_source" ON "application_decisions" ("decision_source");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_application_decisions_decision_source";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_application_decisions_ai_interview_feedback_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_application_decisions_ai_interview_session_id";`,
    );

    await queryRunner.query(`
      ALTER TABLE "application_decisions"
      DROP CONSTRAINT IF EXISTS "fk_application_decisions_ai_interview_feedback_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "application_decisions"
      DROP CONSTRAINT IF EXISTS "fk_application_decisions_ai_interview_session_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "application_decisions"
      DROP COLUMN IF EXISTS "proctoring_risk_snapshot",
      DROP COLUMN IF EXISTS "interviewer_recommendation_snapshot",
      DROP COLUMN IF EXISTS "ai_recommendation_snapshot",
      DROP COLUMN IF EXISTS "final_score",
      DROP COLUMN IF EXISTS "decision_source",
      DROP COLUMN IF EXISTS "ai_interview_feedback_id",
      DROP COLUMN IF EXISTS "ai_interview_session_id",
      DROP COLUMN IF EXISTS "decision_notes";
    `);
  }
}
