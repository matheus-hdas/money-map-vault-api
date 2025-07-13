import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1752105273895 implements MigrationInterface {
  name = 'CreateUserTable1752105273895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying(40) NOT NULL,
                "email" character varying(254) NOT NULL,
                "password" character varying(60) NOT NULL,
                "dateOfBirth" date,
                "defaultCurrency" character varying(10) NOT NULL DEFAULT 'BRL',
                "locale" character varying(10) NOT NULL DEFAULT 'pt-BR',
                "timezone" character varying(50) NOT NULL DEFAULT 'America/Sao_Paulo',
                "createdAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
                "updatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_username" UNIQUE ("username"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
