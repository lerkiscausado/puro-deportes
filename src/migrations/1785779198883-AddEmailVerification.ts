import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerification1785779198883 implements MigrationInterface {
    name = 'AddEmailVerification1785779198883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // DEFAULT 1 (y no 0) porque esta migración nunca se aplicó en ningún entorno antes de este commit.
        // Los usuarios YA EXISTENTES en la BD nunca recibieron un correo de verificación (la funcionalidad
        // no existía cuando se registraron), así que deben quedar automáticamente como verificados.
        // Los usuarios NUEVOS igualmente quedan con emailVerified=false porque users.service.ts lo establece
        // explícitamente al crear la cuenta, independientemente del DEFAULT de la columna en BD.
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerified\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerificationTokenHash\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`emailVerificationTokenExpiresAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerificationTokenExpiresAt\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerificationTokenHash\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`emailVerified\``);
    }

}
