import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillAiFlagOnRescheduledInterviews1786266481719 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "interviews" AS child
      SET "is_ai_interview" = parent."is_ai_interview"
      FROM "interviews" AS parent
      WHERE child."rescheduled_from_interview_id" = parent."id"
        AND child."deleted_at" IS NULL
        AND parent."deleted_at" IS NULL
        AND child."is_ai_interview" = false
        AND parent."is_ai_interview" = true
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // This data repair is intentionally not reversed.
  }
}
