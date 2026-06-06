import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterviewProctoringEvents1780769793106 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_proctoring_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "event_type" varchar(50) NOT NULL,
        "severity" varchar(20) NOT NULL,
        "event_message" text NOT NULL,
        "event_metadata" jsonb,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "duration_seconds" int,
        "is_resolved" boolean NOT NULL DEFAULT false,
        "resolved_at" timestamptz,
        "resolved_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_interview_proctoring_events_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interview_proctoring_events_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interview_proctoring_events_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_session_id" ON "interview_proctoring_events" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_application_id" ON "interview_proctoring_events" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_candidate_id" ON "interview_proctoring_events" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_event_type" ON "interview_proctoring_events" ("event_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_severity" ON "interview_proctoring_events" ("severity");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_occurred_at" ON "interview_proctoring_events" ("occurred_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_is_resolved" ON "interview_proctoring_events" ("is_resolved");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_created_at" ON "interview_proctoring_events" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_deleted_at" ON "interview_proctoring_events" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_session_active" ON "interview_proctoring_events" ("ai_interview_session_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_application_active" ON "interview_proctoring_events" ("application_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_candidate_active" ON "interview_proctoring_events" ("candidate_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_proctoring_events_occurred_at_active" ON "interview_proctoring_events" ("occurred_at") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "interview_proctoring_events";',
    );
  }
}
