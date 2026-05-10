import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobOpeningsTable1778439167639 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_openings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(200) NOT NULL,
        "code" varchar(50) NOT NULL,
        "department_id" uuid NOT NULL,
        "hiring_manager_user_id" uuid NOT NULL,
        "recruiter_user_id" uuid NOT NULL,
        "employment_type" varchar(30) NOT NULL,
        "work_mode" varchar(20) NOT NULL,
        "experience_min_years" int,
        "experience_max_years" int,
        "min_salary" numeric(12,2),
        "max_salary" numeric(12,2),
        "currency_code" varchar(10),
        "openings_count" int NOT NULL,
        "job_description" text,
        "responsibilities" text,
        "requirements" text,
        "location" varchar(255),
        "status" varchar(30) NOT NULL DEFAULT 'DRAFT',
        "published_at" timestamptz,
        "closed_at" timestamptz,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_job_openings_department_id"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_job_openings_hiring_manager_user_id"
          FOREIGN KEY ("hiring_manager_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_job_openings_recruiter_user_id"
          FOREIGN KEY ("recruiter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_openings_code_active"
      ON "job_openings" ("code")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_department_id"
      ON "job_openings" ("department_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_hiring_manager_user_id"
      ON "job_openings" ("hiring_manager_user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_recruiter_user_id"
      ON "job_openings" ("recruiter_user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_status"
      ON "job_openings" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_is_active"
      ON "job_openings" ("is_active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_deleted_at"
      ON "job_openings" ("deleted_at");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_openings_created_at"
      ON "job_openings" ("created_at");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_opening_skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_opening_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "proficiency_level" varchar(20) NOT NULL,
        "is_mandatory" boolean NOT NULL DEFAULT true,
        "years_of_experience_required" int,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,

        CONSTRAINT "fk_job_opening_skills_job_opening_id"
          FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_job_opening_skills_skill_id"
          FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_job_opening_skills_job_opening_skill_active"
      ON "job_opening_skills" ("job_opening_id", "skill_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_opening_skills_job_opening_id"
      ON "job_opening_skills" ("job_opening_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_opening_skills_skill_id"
      ON "job_opening_skills" ("skill_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_job_opening_skills_deleted_at"
      ON "job_opening_skills" ("deleted_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "job_opening_skills";');
    await queryRunner.query('DROP TABLE IF EXISTS "job_openings";');
  }
}
