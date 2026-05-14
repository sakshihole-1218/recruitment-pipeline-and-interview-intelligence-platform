import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplicationsTables1778782764756 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "application_number_seq";
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "applications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_number" varchar(30) NOT NULL,
        "candidate_id" uuid NOT NULL,
        "job_opening_id" uuid NOT NULL,
        "applied_at" timestamptz NOT NULL,
        "current_stage" varchar(30) NOT NULL,
        "application_status" varchar(30) NOT NULL,
        "screening_score" numeric(5,2),
        "fit_score" numeric(5,2),
        "assigned_recruiter_user_id" uuid,
        "assigned_hiring_manager_user_id" uuid,
        "is_priority" boolean NOT NULL DEFAULT false,
        "rejection_reason" text,
        "withdrawal_reason" text,
        "last_stage_changed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_applications_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_applications_job_opening_id"
          FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_applications_assigned_recruiter_user_id"
          FOREIGN KEY ("assigned_recruiter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_applications_assigned_hiring_manager_user_id"
          FOREIGN KEY ("assigned_hiring_manager_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_applications_application_number_active"
      ON "applications" ("application_number")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_candidate_id" ON "applications" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_job_opening_id" ON "applications" ("job_opening_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_current_stage" ON "applications" ("current_stage");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_application_status" ON "applications" ("application_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_assigned_recruiter_user_id" ON "applications" ("assigned_recruiter_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_assigned_hiring_manager_user_id" ON "applications" ("assigned_hiring_manager_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_is_priority" ON "applications" ("is_priority");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_applied_at" ON "applications" ("applied_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_last_stage_changed_at" ON "applications" ("last_stage_changed_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_created_at" ON "applications" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_applications_deleted_at" ON "applications" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_stage_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "from_stage" varchar(30),
        "to_stage" varchar(30) NOT NULL,
        "changed_by_user_id" uuid NOT NULL,
        "change_reason" text,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,

        CONSTRAINT "fk_application_stage_history_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_application_stage_history_changed_by_user_id"
          FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_stage_history_application_id" ON "application_stage_history" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_stage_history_to_stage" ON "application_stage_history" ("to_stage");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_stage_history_changed_at" ON "application_stage_history" ("changed_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_stage_history_deleted_at" ON "application_stage_history" ("deleted_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "application_stage_history";',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "applications";');
    await queryRunner.query(
      'DROP SEQUENCE IF EXISTS "application_number_seq";',
    );
  }
}
