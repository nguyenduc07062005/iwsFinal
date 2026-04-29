import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTagsAndStudyNotes1764000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE tag_type_enum AS ENUM ('SUBJECT', 'TOPIC', 'PURPOSE', 'TAG');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'tags',
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
            name: 'owner_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '80',
          },
          {
            name: 'type',
            type: 'tag_type_enum',
            default: "'TAG'",
          },
          {
            name: 'color',
            type: 'varchar',
            length: '24',
            default: "'#9b3f36'",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tags',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_tags_owner_type_name',
        columnNames: ['owner_id', 'type', 'name'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_document_tags',
        columns: [
          {
            name: 'user_document_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'tag_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_document_tags',
      new TableForeignKey({
        columnNames: ['user_document_id'],
        referencedTableName: 'user_documents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_document_tags',
      new TableForeignKey({
        columnNames: ['tag_id'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user_document_tags',
      new TableIndex({
        name: 'IDX_user_document_tags_tag_id',
        columnNames: ['tag_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'study_notes',
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
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'user_document_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'study_notes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'study_notes',
      new TableForeignKey({
        columnNames: ['user_document_id'],
        referencedTableName: 'user_documents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'study_notes',
      new TableIndex({
        name: 'IDX_study_notes_user_document',
        columnNames: ['user_id', 'user_document_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('study_notes', true);
    await queryRunner.dropTable('user_document_tags', true);
    await queryRunner.dropTable('tags', true);
    await queryRunner.query(`DROP TYPE IF EXISTS tag_type_enum;`);
  }
}
