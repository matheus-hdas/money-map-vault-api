import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalTable1752105347425 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "goal_type_enum" AS ENUM('savings', 'debt_payment', 'spending_limit', 'investment')
        `);

    await queryRunner.query(`
            CREATE TYPE "goal_status_enum" AS ENUM('active', 'completed', 'paused', 'cancelled')
        `);

    await queryRunner.query(`
            CREATE TYPE "goal_period_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly', 'custom')
        `);

    await queryRunner.query(`
            CREATE TABLE "goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "type" "goal_type_enum" NOT NULL,
                "targetAmount" decimal(15,2) NOT NULL,
                "currentAmount" decimal(15,2) NOT NULL DEFAULT 0,
                "currency" character varying(10) NOT NULL DEFAULT 'BRL',
                "startDate" date NOT NULL,
                "targetDate" date NOT NULL,
                "period" "goal_period_enum" NOT NULL DEFAULT 'monthly',
                "status" "goal_status_enum" NOT NULL DEFAULT 'active',
                "color" character varying(7) NOT NULL DEFAULT '#4caf50',
                "icon" character varying(50),
                "progress" decimal(5,2) NOT NULL DEFAULT 0,
                "autoCalculate" boolean NOT NULL DEFAULT true,
                "milestones" json,
                "completedAt" date,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "category_id" uuid,
                CONSTRAINT "PK_goals" PRIMARY KEY ("id"),
                CONSTRAINT "FK_goals_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_goals_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TYPE "goal_period_enum"`);
    await queryRunner.query(`DROP TYPE "goal_status_enum"`);
    await queryRunner.query(`DROP TYPE "goal_type_enum"`);
  }
}
