import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersTable1779296553425 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "offered_role_title" varchar(200) NOT NULL,
        "offered_ctc" numeric(12,2) NOT NULL,
        "joining_bonus" numeric(12,2),
        "currency_code" varchar(10),
        "probation_period_months" int,
        "expected_joining_date" timestamptz NOT NULL,
        "offer_status" varchar(20) NOT NULL,
        "offered_at" timestamptz,
        "accepted_at" timestamptz,
        "declined_at" timestamptz,
        "decline_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_offers_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_application_id" ON "offers" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_offer_status" ON "offers" ("offer_status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_expected_joining_date" ON "offers" ("expected_joining_date");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_offered_at" ON "offers" ("offered_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_created_at" ON "offers" ("created_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_offers_deleted_at" ON "offers" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_offers_application_id_active"
      ON "offers" ("application_id")
      WHERE "deleted_at" IS NULL AND "offer_status" IN ('DRAFT', 'SENT');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "offers";');
  }
}
