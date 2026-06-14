import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLivekitRoomSessionsTable1781003255082 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "livekit_room_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ai_interview_session_id" uuid NOT NULL,
        "interview_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "room_name" varchar(255) NOT NULL,
        "room_status" varchar(20) NOT NULL,
        "candidate_identity" varchar(255),
        "ai_agent_identity" varchar(255),
        "room_started_at" timestamptz,
        "room_ended_at" timestamptz,
        "last_webhook_event_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "deleted_by_user_id" uuid,

        CONSTRAINT "fk_livekit_room_sessions_ai_interview_session_id"
          FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_livekit_room_sessions_interview_id"
          FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_livekit_room_sessions_application_id"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_livekit_room_sessions_candidate_id"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_ai_interview_session_id" ON "livekit_room_sessions" ("ai_interview_session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_interview_id" ON "livekit_room_sessions" ("interview_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_application_id" ON "livekit_room_sessions" ("application_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_candidate_id" ON "livekit_room_sessions" ("candidate_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_room_status_active" ON "livekit_room_sessions" ("room_status") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_livekit_room_sessions_created_at_active" ON "livekit_room_sessions" ("created_at") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_livekit_room_sessions_ai_session_active" ON "livekit_room_sessions" ("ai_interview_session_id") WHERE "deleted_at" IS NULL;`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_livekit_room_sessions_room_name_active" ON "livekit_room_sessions" ("room_name") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "livekit_room_sessions";');
  }
}
