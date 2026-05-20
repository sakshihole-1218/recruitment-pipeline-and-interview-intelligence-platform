import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewsTable1778933064142 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_rounds" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_opening_id" uuid NOT NULL,
        "round_name" varchar(150) NOT NULL,
        "round_type" varchar(30) NOT NULL,
        "sequence_number" int NOT NULL,
        "is_mandatory" boolean NOT NULL DEFAULT true,
        "max_score" int,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_interview_rounds_job_opening_id"
          FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_interview_rounds_job_opening_sequence_active"
      ON "interview_rounds" ("job_opening_id", "sequence_number")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_rounds_job_opening_id" ON "interview_rounds" ("job_opening_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_rounds_sequence_number" ON "interview_rounds" ("sequence_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_rounds_created_at" ON "interview_rounds" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_rounds_deleted_at" ON "interview_rounds" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "interview_round_id" uuid NOT NULL,
        "scheduled_start_at" timestamptz NOT NULL,
        "scheduled_end_at" timestamptz NOT NULL,
        "interview_mode" varchar(20) NOT NULL,
        "meeting_link" text,
        "location_details" text,
        "interview_status" varchar(20) NOT NULL,
        "scheduled_by_user_id" uuid NOT NULL,
        "rescheduled_from_interview_id" uuid,
        "reschedule_reason" text,
        "cancel_reason" text,
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_interviews_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviews_interview_round_id"
          FOREIGN KEY ("interview_round_id") REFERENCES "interview_rounds"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviews_scheduled_by_user_id"
          FOREIGN KEY ("scheduled_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interviews_rescheduled_from_interview_id"
          FOREIGN KEY ("rescheduled_from_interview_id") REFERENCES "interviews"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_application_id" ON "interviews" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_interview_round_id" ON "interviews" ("interview_round_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_scheduled_by_user_id" ON "interviews" ("scheduled_by_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_interview_status" ON "interviews" ("interview_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_interview_mode" ON "interviews" ("interview_mode");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_scheduled_start_at" ON "interviews" ("scheduled_start_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_completed_at" ON "interviews" ("completed_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_created_at" ON "interviews" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interviews_deleted_at" ON "interviews" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_panel_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "interview_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role_in_panel" varchar(30) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,

        CONSTRAINT "fk_interview_panel_members_interview_id"
          FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interview_panel_members_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_interview_panel_members_interview_user_active"
      ON "interview_panel_members" ("interview_id", "user_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_panel_members_interview_id" ON "interview_panel_members" ("interview_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_panel_members_user_id" ON "interview_panel_members" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_panel_members_deleted_at" ON "interview_panel_members" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_feedback" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "interview_id" uuid NOT NULL,
        "interviewer_user_id" uuid NOT NULL,
        "technical_score" int NOT NULL,
        "communication_score" int NOT NULL,
        "problem_solving_score" int NOT NULL,
        "culture_fit_score" int NOT NULL,
        "overall_score" numeric(5,2) NOT NULL,
        "strengths" text,
        "concerns" text,
        "detailed_feedback" text,
        "recommendation" varchar(30) NOT NULL,
        "submitted_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_interview_feedback_interview_id"
          FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_interview_feedback_interviewer_user_id"
          FOREIGN KEY ("interviewer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_interview_feedback_interview_interviewer_active"
      ON "interview_feedback" ("interview_id", "interviewer_user_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_interview_id" ON "interview_feedback" ("interview_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_interviewer_user_id" ON "interview_feedback" ("interviewer_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_recommendation" ON "interview_feedback" ("recommendation");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_submitted_at" ON "interview_feedback" ("submitted_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_created_at" ON "interview_feedback" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interview_feedback_deleted_at" ON "interview_feedback" ("deleted_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "interview_feedback";');
    await queryRunner.query('DROP TABLE IF EXISTS "interview_panel_members";');
    await queryRunner.query('DROP TABLE IF EXISTS "interviews";');
    await queryRunner.query('DROP TABLE IF EXISTS "interview_rounds";');
  }
}
