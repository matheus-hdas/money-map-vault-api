import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1752105273895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "firstName" character varying(100) NOT NULL,
                "lastName" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "phone" character varying(20),
                "dateOfBirth" date,
                "defaultCurrency" character varying(10) NOT NULL DEFAULT 'BRL',
                "locale" character varying(10) NOT NULL DEFAULT 'pt-BR',
                "timezone" character varying(50) NOT NULL DEFAULT 'America/Sao_Paulo',
                "emailNotifications" boolean NOT NULL DEFAULT true,
                "isEmailVerified" boolean NOT NULL DEFAULT false,
                "emailVerificationToken" character varying(255),
                "emailVerifiedAt" timestamp,
                "passwordResetToken" character varying(255),
                "passwordResetExpiresAt" timestamp,
                "lastLoginAt" timestamp,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
