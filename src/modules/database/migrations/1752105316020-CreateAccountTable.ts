import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountTable1752105316020 implements MigrationInterface {
  name = 'CreateAccountTable1752105316020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "account_type_enum" AS ENUM('checking', 'savings', 'credit_card', 'investment', 'cash', 'other')
        `);

    await queryRunner.query(`
            CREATE TABLE "accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "type" "account_type_enum" NOT NULL,
                "bank" character varying(100),
                "accountNumber" character varying(20),
                "balance" decimal(15,2) NOT NULL DEFAULT 0,
                "initialBalance" decimal(15,2) NOT NULL DEFAULT 0,
                "currency" character varying(10) NOT NULL DEFAULT 'BRL',
                "color" character varying(7) NOT NULL DEFAULT '#1976d2',
                "icon" character varying(50),
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "includeInTotals" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_accounts_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "account_type_enum"`);
  }
}
