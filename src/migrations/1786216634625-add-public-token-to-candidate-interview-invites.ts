import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicTokenToCandidateInterviewInvites1786216634625 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "candidate_interview_invites" ADD COLUMN "public_token" varchar(128)`,
        );

        await queryRunner.query(
            `CREATE UNIQUE INDEX "idx_candidate_interview_invites_public_token_active" ON "candidate_interview_invites" ("public_token") WHERE "deleted_at" IS NULL AND "public_token" IS NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."idx_candidate_interview_invites_public_token_active"`,
        );

        await queryRunner.query(
            `ALTER TABLE "candidate_interview_invites" DROP COLUMN "public_token"`,
        );
    }

}
