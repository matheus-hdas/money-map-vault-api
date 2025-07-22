import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionTable1752105345146 implements MigrationInterface {
  name = 'CreateTransactionTable1752105345146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "transaction_type_enum" AS ENUM('income', 'expense', 'transfer')
        `);

    await queryRunner.query(`
            CREATE TYPE "transaction_status_enum" AS ENUM('pending', 'completed', 'cancelled')
        `);

    await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "transaction_type_enum" NOT NULL,
                "amount" decimal(15,2) NOT NULL,
                "description" character varying(255) NOT NULL,
                "notes" text,
                "date" date NOT NULL,
                "status" "transaction_status_enum" NOT NULL DEFAULT 'completed',
                "currency" character varying(10) NOT NULL DEFAULT 'BRL',
                "reference" character varying(255),
                "attachments" json,
                "tags" json,
                "location" character varying(255),
                "isRecurring" boolean NOT NULL DEFAULT false,
                "recurringPattern" character varying(50),
                "recurringEndDate" date,
                "recurringGroupId" uuid,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                "categoryId" uuid,
                "fromAccountId" uuid,
                "toAccountId" uuid,
                CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_transactions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_transactions_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_transactions_fromAccountId" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_transactions_toAccountId" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
  }
}
