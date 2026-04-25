import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccessControlTable1777128012779 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(25),
        "password_hash" varchar(255) NOT NULL,
        "refresh_token_hash" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_is_active"
      ON "users" ("is_active");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "description" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "uq_roles_code" UNIQUE ("code")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,

        CONSTRAINT "uq_user_roles_user_role" UNIQUE ("user_id", "role_id"),

        CONSTRAINT "fk_user_roles_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_user_roles_role_id"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id"
      ON "user_roles" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id"
      ON "user_roles" ("role_id");
    `);

    await queryRunner.query(`
      INSERT INTO "roles" ("name", "code", "description") VALUES
        ('Admin', 'ADMIN', 'System administrator with full access'),
        ('Recruiter', 'RECRUITER', 'Manages candidate pipeline and interview coordination'),
        ('Interviewer', 'INTERVIEWER', 'Conducts interviews and provides feedback'),
        ('Hiring Manager', 'HIRING_MANAGER', 'Owns hiring decisions and approvals')
      ON CONFLICT ("code") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "user_roles";');
    await queryRunner.query('DROP TABLE IF EXISTS "roles";');
    await queryRunner.query('DROP TABLE IF EXISTS "users";');
  }
}
