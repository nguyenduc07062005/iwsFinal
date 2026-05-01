import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCsrfTokenHashToUserSessions1764000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_sessions',
      new TableColumn({
        name: 'csrf_token_hash',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_sessions', 'csrf_token_hash');
  }
}
