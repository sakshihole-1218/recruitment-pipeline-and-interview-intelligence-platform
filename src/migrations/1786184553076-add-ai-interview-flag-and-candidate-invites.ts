import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiInterviewFlagAndCandidateInvites1786184553076 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD COLUMN "is_ai_interview" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      CREATE TABLE "candidate_interview_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "interview_id" uuid NOT NULL,
        "ai_interview_session_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "status" varchar(20) NOT NULL,
        "valid_from" TIMESTAMPTZ,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "first_accessed_at" TIMESTAMPTZ,
        "last_accessed_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,
        CONSTRAINT "PK_candidate_interview_invites_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_candidate_interview_invites_token_hash_active" ON "candidate_interview_invites" ("token_hash") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_candidate_interview_invites_interview_id_active" ON "candidate_interview_invites" ("interview_id") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" ADD CONSTRAINT "FK_candidate_interview_invites_interview" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" ADD CONSTRAINT "FK_candidate_interview_invites_session" FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" ADD CONSTRAINT "FK_candidate_interview_invites_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" DROP CONSTRAINT "FK_candidate_interview_invites_candidate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" DROP CONSTRAINT "FK_candidate_interview_invites_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_interview_invites" DROP CONSTRAINT "FK_candidate_interview_invites_interview"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_candidate_interview_invites_interview_id_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_candidate_interview_invites_token_hash_active"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_interview_invites"`);
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP COLUMN "is_ai_interview"`,
    );
  }

}
