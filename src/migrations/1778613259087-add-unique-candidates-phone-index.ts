import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueCandidatesPhoneIndex1778613259087 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates = await queryRunner.query(`
      SELECT "phone", COUNT(*)::int AS cnt
      FROM "candidates"
      WHERE "deleted_at" IS NULL AND "phone" IS NOT NULL
      GROUP BY "phone"
      HAVING COUNT(*) > 1
      LIMIT 1;
    `);

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      const phone = duplicates[0]?.phone;
      throw new Error(
        `Cannot add unique phone index: duplicate active candidate phone detected (${phone}). ` +
          `Resolve duplicates (or soft-delete one) and re-run migration.`,
      );
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_candidates_phone_active"
      ON "candidates" ("phone")
      WHERE "deleted_at" IS NULL AND "phone" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_candidates_phone_active";`,
    );
  }
}
