import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseIndexes1752114988825 implements MigrationInterface {
  name = 'AddDatabaseIndexes1752114988825';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "IDX_users_username" ON "users" ("username")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_users_email" ON "users" ("email")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_users_createdAt" ON "users" ("createdAt")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_userId" ON "accounts" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_type" ON "accounts" ("type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_isActive" ON "accounts" ("isActive")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_userId_type" ON "accounts" ("userId", "type")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_categories_userId" ON "categories" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_type" ON "categories" ("type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_isSystem" ON "categories" ("isSystem")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_isActive" ON "categories" ("isActive")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_parentId" ON "categories" ("parentId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_userId_type" ON "categories" ("userId", "type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_sortOrder" ON "categories" ("sortOrder")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_userId" ON "transactions" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_categoryId" ON "transactions" ("categoryId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_fromAccountId" ON "transactions" ("fromAccountId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_toAccountId" ON "transactions" ("toAccountId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_type" ON "transactions" ("type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_date" ON "transactions" ("date")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_createdAt" ON "transactions" ("createdAt")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_userId_date" ON "transactions" ("userId", "date")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_userId_type" ON "transactions" ("userId", "type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_userId_categoryId" ON "transactions" ("userId", "categoryId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_date_desc" ON "transactions" ("date" DESC)
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_isRecurring" ON "transactions" ("isRecurring")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_recurringGroupId" ON "transactions" ("recurringGroupId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_goals_userId" ON "goals" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_categoryId" ON "goals" ("categoryId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_type" ON "goals" ("type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_status" ON "goals" ("status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_startDate" ON "goals" ("startDate")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_targetDate" ON "goals" ("targetDate")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_userId_status" ON "goals" ("userId", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_userId_type" ON "goals" ("userId", "type")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_userId" ON "budgets" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_categoryId" ON "budgets" ("categoryId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_status" ON "budgets" ("status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_period" ON "budgets" ("period")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_startDate" ON "budgets" ("startDate")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_endDate" ON "budgets" ("endDate")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_userId_status" ON "budgets" ("userId", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_userId_period" ON "budgets" ("userId", "period")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_date_range" ON "budgets" ("startDate", "endDate")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_budgets_date_range"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_userId_period"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_userId_status"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_endDate"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_startDate"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_period"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_status"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_categoryId"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_userId"`);

    await queryRunner.query(`DROP INDEX "IDX_goals_userId_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_userId_status"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_targetDate"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_startDate"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_status"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_categoryId"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_userId"`);

    await queryRunner.query(`DROP INDEX "IDX_transactions_recurringGroupId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_isRecurring"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_date_desc"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_userId_categoryId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_userId_type"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_userId_date"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_type"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_toAccountId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_fromAccountId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_categoryId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_userId"`);

    await queryRunner.query(`DROP INDEX "IDX_categories_sortOrder"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_userId_type"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_parentId"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_isSystem"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_type"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_userId"`);

    await queryRunner.query(`DROP INDEX "IDX_accounts_userId_type"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_type"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_userId"`);

    await queryRunner.query(`DROP INDEX "IDX_users_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
  }
}
