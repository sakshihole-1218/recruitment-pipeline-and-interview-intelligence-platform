import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidatesTable1778524610143 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "candidates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(30),
        "date_of_birth" date,
        "gender" varchar(30),
        "total_experience_years" numeric(6,2),
        "current_company" varchar(200),
        "current_job_title" varchar(200),
        "current_location" varchar(255),
        "notice_period_days" int,
        "current_salary" numeric(12,2),
        "expected_salary" numeric(12,2),
        "currency_code" varchar(10),
        "linkedin_url" varchar(500),
        "github_url" varchar(500),
        "portfolio_url" varchar(500),
        "resume_headline" varchar(250),
        "source_type" varchar(30),
        "source_details" text,
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
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_candidates_email_active"
      ON "candidates" ("email")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_first_name" ON "candidates" ("first_name");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_last_name" ON "candidates" ("last_name");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_email" ON "candidates" ("email");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_phone" ON "candidates" ("phone");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_source_type" ON "candidates" ("source_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_current_location" ON "candidates" ("current_location");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_total_experience_years" ON "candidates" ("total_experience_years");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_is_active" ON "candidates" ("is_active");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_deleted_at" ON "candidates" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidates_created_at" ON "candidates" ("created_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "candidate_skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "years_of_experience" numeric(6,2),
        "proficiency_level" varchar(20),
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,

        CONSTRAINT "fk_candidate_skills_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_candidate_skills_skill_id"
          FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_candidate_skills_candidate_skill_active"
      ON "candidate_skills" ("candidate_id", "skill_id")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_skills_candidate_id" ON "candidate_skills" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_skills_skill_id" ON "candidate_skills" ("skill_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_skills_is_primary" ON "candidate_skills" ("is_primary");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_skills_deleted_at" ON "candidate_skills" ("deleted_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "candidate_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" uuid NOT NULL,
        "document_type" varchar(30) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "file_url" text NOT NULL,
        "file_size" bigint,
        "mime_type" varchar(150),
        "uploaded_at" timestamptz,
        "is_latest" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_candidate_documents_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_candidate_latest_resume_active"
      ON "candidate_documents" ("candidate_id")
      WHERE "deleted_at" IS NULL AND "document_type" = 'RESUME' AND "is_latest" = true;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_documents_candidate_id" ON "candidate_documents" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_documents_document_type" ON "candidate_documents" ("document_type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_documents_is_latest" ON "candidate_documents" ("is_latest");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_documents_deleted_at" ON "candidate_documents" ("deleted_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_candidate_documents_uploaded_at" ON "candidate_documents" ("uploaded_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "candidate_documents";');
    await queryRunner.query('DROP TABLE IF EXISTS "candidate_skills";');
    await queryRunner.query('DROP TABLE IF EXISTS "candidates";');
  }
}
