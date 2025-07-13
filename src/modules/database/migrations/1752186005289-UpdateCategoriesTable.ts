import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCategoriesTable1752186005289 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'categories' AND column_name = 'parentId'
                ) THEN
                    ALTER TABLE "categories" ADD COLUMN "parentId" uuid;
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'categories' AND column_name = 'userId'
                ) THEN
                    ALTER TABLE "categories" ADD COLUMN "userId" uuid;
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'categories' AND column_name = 'parentId'
                ) THEN
                    ALTER TABLE "categories" DROP COLUMN "parentId";
                END IF;
                
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'categories' AND column_name = 'userId'
                ) THEN
                    ALTER TABLE "categories" DROP COLUMN "userId";
                END IF;
            END $$;
        `);
  }
}
