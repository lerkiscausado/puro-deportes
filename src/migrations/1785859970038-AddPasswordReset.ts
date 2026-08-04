import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordReset1785859970038 implements MigrationInterface {
    name = 'AddPasswordReset1785859970038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`passwordResetTokenHash\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`passwordResetTokenExpiresAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`passwordResetTokenExpiresAt\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`passwordResetTokenHash\``);
    }

}
