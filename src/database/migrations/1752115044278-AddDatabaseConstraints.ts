import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseConstraints1752115044278 implements MigrationInterface {
  name = 'AddDatabaseConstraints1752115044278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_email_format" 
            CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
        `);
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_firstName_length" 
            CHECK (length(trim("firstName")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_lastName_length" 
            CHECK (length(trim("lastName")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_password_length" 
            CHECK (length("password") >= 8)
        `);
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_phone_format" 
            CHECK (phone IS NULL OR phone ~* '^[0-9+()-\\s]+$')
        `);
    await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "CHK_users_dateOfBirth_valid" 
            CHECK ("dateOfBirth" IS NULL OR "dateOfBirth" <= CURRENT_DATE)
        `);

    await queryRunner.query(`
            ALTER TABLE "accounts" ADD CONSTRAINT "CHK_accounts_name_length" 
            CHECK (length(trim("name")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "accounts" ADD CONSTRAINT "CHK_accounts_balance_precision" 
            CHECK ("balance" >= -99999999999999.99 AND "balance" <= 99999999999999.99)
        `);
    await queryRunner.query(`
            ALTER TABLE "accounts" ADD CONSTRAINT "CHK_accounts_initialBalance_precision" 
            CHECK ("initialBalance" >= -99999999999999.99 AND "initialBalance" <= 99999999999999.99)
        `);
    await queryRunner.query(`
            ALTER TABLE "accounts" ADD CONSTRAINT "CHK_accounts_color_format" 
            CHECK ("color" ~* '^#[0-9A-Fa-f]{6}$')
        `);
    await queryRunner.query(`
            ALTER TABLE "accounts" ADD CONSTRAINT "CHK_accounts_currency_format" 
            CHECK (length("currency") = 3 AND upper("currency") = "currency")
        `);

    await queryRunner.query(`
            ALTER TABLE "categories" ADD CONSTRAINT "CHK_categories_name_length" 
            CHECK (length(trim("name")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "categories" ADD CONSTRAINT "CHK_categories_color_format" 
            CHECK ("color" ~* '^#[0-9A-Fa-f]{6}$')
        `);
    await queryRunner.query(`
            ALTER TABLE "categories" ADD CONSTRAINT "CHK_categories_sortOrder_positive" 
            CHECK ("sortOrder" >= 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "categories" ADD CONSTRAINT "CHK_categories_no_self_parent" 
            CHECK ("parent_id" IS NULL OR "parent_id" != "id")
        `);

    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_amount_positive" 
            CHECK ("amount" > 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_description_length" 
            CHECK (length(trim("description")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_currency_format" 
            CHECK (length("currency") = 3 AND upper("currency") = "currency")
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_date_valid" 
            CHECK ("date" <= CURRENT_DATE + INTERVAL '1 year')
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_recurringEndDate_valid" 
            CHECK ("recurringEndDate" IS NULL OR "recurringEndDate" > "date")
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_transfer_accounts" 
            CHECK (
                (type != 'transfer') OR 
                (type = 'transfer' AND "from_account_id" IS NOT NULL AND "to_account_id" IS NOT NULL AND "from_account_id" != "to_account_id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_recurring_pattern" 
            CHECK (
                ("isRecurring" = false AND "recurringPattern" IS NULL) OR
                ("isRecurring" = true AND "recurringPattern" IS NOT NULL)
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_name_length" 
            CHECK (length(trim("name")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_targetAmount_positive" 
            CHECK ("targetAmount" > 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_currentAmount_nonnegative" 
            CHECK ("currentAmount" >= 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_currency_format" 
            CHECK (length("currency") = 3 AND upper("currency") = "currency")
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_date_range" 
            CHECK ("startDate" <= "targetDate")
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_progress_range" 
            CHECK ("progress" >= 0 AND "progress" <= 100)
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_color_format" 
            CHECK ("color" ~* '^#[0-9A-Fa-f]{6}$')
        `);
    await queryRunner.query(`
            ALTER TABLE "goals" ADD CONSTRAINT "CHK_goals_completedAt_valid" 
            CHECK (
                ("status" != 'completed' AND "completedAt" IS NULL) OR
                ("status" = 'completed' AND "completedAt" IS NOT NULL)
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_name_length" 
            CHECK (length(trim("name")) >= 2)
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_amount_positive" 
            CHECK ("amount" > 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_spent_nonnegative" 
            CHECK ("spent" >= 0)
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_remaining_calculation" 
            CHECK ("remaining" = "amount" - "spent")
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_currency_format" 
            CHECK (length("currency") = 3 AND upper("currency") = "currency")
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_date_range" 
            CHECK ("startDate" <= "endDate")
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_alertThreshold_range" 
            CHECK ("alertThreshold" >= 0 AND "alertThreshold" <= 100)
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_progress_range" 
            CHECK ("progress" >= 0 AND "progress" <= 100)
        `);
    await queryRunner.query(`
            ALTER TABLE "budgets" ADD CONSTRAINT "CHK_budgets_color_format" 
            CHECK ("color" ~* '^#[0-9A-Fa-f]{6}$')
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_color_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_progress_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_alertThreshold_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_date_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_currency_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_remaining_calculation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_spent_nonnegative"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_amount_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "CHK_budgets_name_length"`,
    );

    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_completedAt_valid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_color_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_progress_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_date_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_currency_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_currentAmount_nonnegative"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_targetAmount_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "CHK_goals_name_length"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_recurring_pattern"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_transfer_accounts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_recurringEndDate_valid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_date_valid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_currency_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_description_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_amount_positive"`,
    );

    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "CHK_categories_no_self_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "CHK_categories_sortOrder_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "CHK_categories_color_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "CHK_categories_name_length"`,
    );

    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "CHK_accounts_currency_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "CHK_accounts_color_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "CHK_accounts_initialBalance_precision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "CHK_accounts_balance_precision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "CHK_accounts_name_length"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_dateOfBirth_valid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_phone_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_password_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_lastName_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_firstName_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_email_format"`,
    );
  }
}
