import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdminAuditLogs1764000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.createTable(
      new Table({
        name: 'admin_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'admin_id',
            type: 'uuid',
          },
          {
            name: 'target_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '80',
          },
          {
            name: 'target_type',
            type: 'varchar',
            length: '80',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'admin_audit_logs',
      new TableIndex({
        name: 'IDX_admin_audit_logs_admin_created',
        columnNames: ['admin_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'admin_audit_logs',
      new TableIndex({
        name: 'IDX_admin_audit_logs_target_created',
        columnNames: ['target_user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'admin_audit_logs',
      new TableIndex({
        name: 'IDX_admin_audit_logs_action_created',
        columnNames: ['action', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_audit_logs', true);
  }
}
