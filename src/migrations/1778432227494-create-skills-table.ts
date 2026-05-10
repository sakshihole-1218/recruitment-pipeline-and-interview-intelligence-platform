import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkillsTable1778432227494 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "code" varchar(50) NOT NULL,
        "description" text,
        "category" varchar(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skills_code" ON "skills" ("code");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skills_category" ON "skills" ("category");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skills_is_active" ON "skills" ("is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skills_deleted_at" ON "skills" ("deleted_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "skills";');
  }
}
