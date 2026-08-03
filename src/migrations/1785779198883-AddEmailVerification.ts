import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerification1785779198883 implements MigrationInterface {
    name = 'AddEmailVerification1785779198883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerificationTokenHash\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerificationTokenExpiresAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerificationTokenExpiresAt\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerificationTokenHash\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerified\``);
    }

}
