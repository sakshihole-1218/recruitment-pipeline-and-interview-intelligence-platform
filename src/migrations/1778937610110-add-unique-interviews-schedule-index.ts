import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueInterviewsScheduleIndex1778937610110 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_interviews_schedule_key_active"
      ON "interviews" ("application_id", "interview_round_id", "scheduled_start_at", "scheduled_end_at")
      WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_interviews_schedule_key_active";',
    );
  }
}
