import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1752105341867 implements MigrationInterface {
  name = 'CreateCategoryTable1752105341867';

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
                "parentId" uuid,
                "userId" uuid,
                CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
                CONSTRAINT "FK_categories_parentId" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_categories_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "category_type_enum"`);
  }
}
