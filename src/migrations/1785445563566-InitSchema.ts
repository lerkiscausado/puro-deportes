import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1785445563566 implements MigrationInterface {
    name = 'InitSchema1785445563566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jugadores\` CHANGE \`identificacion\` \`identificacion\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`jugadores\` ADD UNIQUE INDEX \`IDX_d8c5b005f522ec4bc57821a5ad\` (\`identificacion\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jugadores\` DROP INDEX \`IDX_d8c5b005f522ec4bc57821a5ad\``);
        await queryRunner.query(`ALTER TABLE \`jugadores\` CHANGE \`identificacion\` \`identificacion\` varchar(255) NULL`);
    }

}
