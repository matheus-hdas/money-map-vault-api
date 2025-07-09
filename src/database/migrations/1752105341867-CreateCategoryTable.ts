import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1752105341867 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "category_type_enum" AS ENUM('income', 'expense', 'transfer')
        `);

    await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "type" "category_type_enum" NOT NULL,
                "color" character varying(7) NOT NULL DEFAULT '#2196f3',
                "icon" character varying(50),
                "description" text,
                "isSystem" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                "parent_id" uuid,
                "user_id" uuid,
                CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
                CONSTRAINT "FK_categories_parent_id" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_categories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "category_type_enum"`);
  }
}
