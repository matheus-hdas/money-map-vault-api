import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetTable1752105349185 implements MigrationInterface {
  name = 'CreateBudgetTable1752105349185';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "budget_period_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly')
        `);

    await queryRunner.query(`
            CREATE TYPE "budget_status_enum" AS ENUM('active', 'inactive', 'exceeded', 'completed')
        `);

    await queryRunner.query(`
            CREATE TABLE "budgets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "amount" decimal(15,2) NOT NULL,
                "spent" decimal(15,2) NOT NULL DEFAULT 0,
                "remaining" decimal(15,2) NOT NULL DEFAULT 0,
                "currency" character varying(10) NOT NULL DEFAULT 'BRL',
                "period" "budget_period_enum" NOT NULL DEFAULT 'monthly',
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "status" "budget_status_enum" NOT NULL DEFAULT 'active',
                "color" character varying(7) NOT NULL DEFAULT '#ff9800',
                "autoReset" boolean NOT NULL DEFAULT true,
                "alertEnabled" boolean NOT NULL DEFAULT true,
                "alertThreshold" decimal(5,2) NOT NULL DEFAULT 80,
                "progress" decimal(5,2) NOT NULL DEFAULT 0,
                "includeSubcategories" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                CONSTRAINT "PK_budgets" PRIMARY KEY ("id"),
                CONSTRAINT "FK_budgets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_budgets_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TYPE "budget_status_enum"`);
    await queryRunner.query(`DROP TYPE "budget_period_enum"`);
  }
}
