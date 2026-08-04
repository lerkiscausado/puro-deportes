import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserFoto1785860500000 implements MigrationInterface {
    name = 'AddUserFoto1785860500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`foto\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`foto\``);
    }
}
