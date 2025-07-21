import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationToUsers1752688350809
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE;
            ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP;
            ALTER TABLE "users" ADD COLUMN "emailVerificationToken" VARCHAR(255);
            ALTER TABLE "users" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "emailVerified";
            ALTER TABLE "users" DROP COLUMN "emailVerifiedAt";
            ALTER TABLE "users" DROP COLUMN "emailVerificationToken";
            ALTER TABLE "users" DROP COLUMN "emailVerificationExpiresAt";
        `);
  }
}
