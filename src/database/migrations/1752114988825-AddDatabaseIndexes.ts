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
            CREATE INDEX "IDX_accounts_user_id" ON "accounts" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_type" ON "accounts" ("type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_isActive" ON "accounts" ("isActive")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_accounts_user_type" ON "accounts" ("user_id", "type")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_categories_user_id" ON "categories" ("user_id")
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
            CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_user_type" ON "categories" ("user_id", "type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_categories_sortOrder" ON "categories" ("sortOrder")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_category_id" ON "transactions" ("category_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_from_account_id" ON "transactions" ("from_account_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_to_account_id" ON "transactions" ("to_account_id")
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
            CREATE INDEX "IDX_transactions_user_date" ON "transactions" ("user_id", "date")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_user_type" ON "transactions" ("user_id", "type")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_transactions_user_category" ON "transactions" ("user_id", "category_id")
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
            CREATE INDEX "IDX_goals_user_id" ON "goals" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_category_id" ON "goals" ("category_id")
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
            CREATE INDEX "IDX_goals_user_status" ON "goals" ("user_id", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_goals_user_type" ON "goals" ("user_id", "type")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_user_id" ON "budgets" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_category_id" ON "budgets" ("category_id")
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
            CREATE INDEX "IDX_budgets_user_status" ON "budgets" ("user_id", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_user_period" ON "budgets" ("user_id", "period")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_budgets_date_range" ON "budgets" ("startDate", "endDate")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_budgets_date_range"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_user_period"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_endDate"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_startDate"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_period"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_status"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_budgets_user_id"`);

    await queryRunner.query(`DROP INDEX "IDX_goals_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_targetDate"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_startDate"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_status"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_user_id"`);

    await queryRunner.query(`DROP INDEX "IDX_transactions_recurringGroupId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_isRecurring"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_date_desc"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_user_category"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_user_date"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_type"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_to_account_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_from_account_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_user_id"`);

    await queryRunner.query(`DROP INDEX "IDX_categories_sortOrder"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_parent_id"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_isSystem"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_type"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_user_id"`);

    await queryRunner.query(`DROP INDEX "IDX_accounts_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_type"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_user_id"`);

    await queryRunner.query(`DROP INDEX "IDX_users_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
  }
}
