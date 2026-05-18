import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplicationDecisionsTable1779127502689 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_decisions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "decision_status" varchar(30) NOT NULL,
        "decision_reason" text,
        "decided_by_user_id" uuid NOT NULL,
        "decision_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_application_decisions_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_application_decisions_decided_by_user_id"
          FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_application_decisions_created_by_user_id"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_application_decisions_updated_by_user_id"
          FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_application_decisions_deleted_by_user_id"
          FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_application_decisions_application_id_active"
      ON "application_decisions" ("application_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_application_id" ON "application_decisions" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_decided_by_user_id" ON "application_decisions" ("decided_by_user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_decision_status" ON "application_decisions" ("decision_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_decision_at" ON "application_decisions" ("decision_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_application_decisions_created_at" ON "application_decisions" ("created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "application_decisions";`);
  }
}
