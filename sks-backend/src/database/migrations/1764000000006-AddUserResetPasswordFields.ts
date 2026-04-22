import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserResetPasswordFields1764000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'reset_password_token_hash',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reset_password_token_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'reset_password_token_expires_at');
    await queryRunner.dropColumn('users', 'reset_password_token_hash');
  }
}
