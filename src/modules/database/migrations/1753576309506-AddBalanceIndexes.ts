import { MigrationInterface, QueryRunner } from 'typeorm';

export class BalanceIndexes1753576309506 implements MigrationInterface {
  name = 'BalanceIndexes1753576309506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_to_account_status"
      ON "transactions" ("toAccountId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_from_account_status"
      ON "transactions" ("fromAccountId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_date_account"
      ON "transactions" ("date", "fromAccountId", "toAccountId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_account_date_status"
      ON "transactions" ("fromAccountId", "toAccountId", "date", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_date_status"
      ON "transactions" ("date", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_date_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_account_date_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_date_account"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_from_account_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_to_account_status"`,
    );
  }
}
