import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogsTables1779436055554 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_notes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "note_type" varchar(40) NOT NULL,
        "note_text" text NOT NULL,
        "is_private" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_application_notes_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_application_notes_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_application_id" ON "application_notes" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_user_id" ON "application_notes" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_note_type" ON "application_notes" ("note_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_is_private" ON "application_notes" ("is_private");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_created_at" ON "application_notes" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_notes_deleted_at" ON "application_notes" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "entity_type" varchar(30) NOT NULL,
        "entity_id" uuid NOT NULL,
        "action_type" varchar(30) NOT NULL,
        "old_values" jsonb,
        "new_values" jsonb,
        "action_by_user_id" uuid NOT NULL,
        "action_at" timestamptz NOT NULL DEFAULT now(),
        "ip_address" varchar(64),
        "user_agent" varchar(512),
        "created_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "fk_activity_logs_action_by_user_id"
          FOREIGN KEY ("action_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity_type" ON "activity_logs" ("entity_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity_id" ON "activity_logs" ("entity_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_action_type" ON "activity_logs" ("action_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_action_by_user_id" ON "activity_logs" ("action_by_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_action_at" ON "activity_logs" ("action_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "activity_logs" ("created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "activity_logs";');
    await queryRunner.query('DROP TABLE IF EXISTS "application_notes";');
  }
}
