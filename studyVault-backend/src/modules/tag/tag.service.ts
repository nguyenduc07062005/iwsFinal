import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tag, TagType } from 'src/database/entities/tag.entity';
import { CreateTagDto } from './dtos/create-tag.dto';
import { ListTagsDto } from './dtos/list-tags.dto';
import { UpdateTagDto } from './dtos/update-tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly dataSource: DataSource) {}

  async listTags(ownerId: string, query: ListTagsDto = {}) {
    const queryBuilder = this.dataSource
      .getRepository(Tag)
      .createQueryBuilder('tag')
      .where('tag.ownerId = :ownerId', { ownerId })
      .orderBy('tag.type', 'ASC')
      .addOrderBy('LOWER(tag.name)', 'ASC');

    if (query.type) {
      queryBuilder.andWhere('tag.type = :type', { type: query.type });
    }

    const tags = await queryBuilder.getMany();
    return tags.map((tag) => this.toTagDto(tag));
  }

  async createTag(ownerId: string, dto: CreateTagDto) {
    const name = this.normalizeName(dto.name);
    const type = dto.type ?? TagType.TAG;
    const color = dto.color ?? '#9b3f36';

    await this.ensureNoDuplicate(ownerId, name, type);

    const tag = this.dataSource.getRepository(Tag).create({
      ownerId,
      name,
      type,
      color,
    });

    return this.toTagDto(await this.dataSource.getRepository(Tag).save(tag));
  }

  async updateTag(ownerId: string, tagId: string, dto: UpdateTagDto) {
    const tag = await this.findOwnedTag(ownerId, tagId);
    const nextName = dto.name ? this.normalizeName(dto.name) : tag.name;
    const nextType = dto.type ?? tag.type;

    if (nextName !== tag.name || nextType !== tag.type) {
      await this.ensureNoDuplicate(ownerId, nextName, nextType, tag.id);
    }

    tag.name = nextName;
    tag.type = nextType;
    tag.color = dto.color ?? tag.color;

    return this.toTagDto(await this.dataSource.getRepository(Tag).save(tag));
  }

  async deleteTag(ownerId: string, tagId: string) {
    const tag = await this.findOwnedTag(ownerId, tagId);
    await this.dataSource.getRepository(Tag).delete(tag.id);
    return { id: tag.id };
  }

  private async findOwnedTag(ownerId: string, tagId: string) {
    const tag = await this.dataSource.getRepository(Tag).findOne({
      where: { id: tagId, ownerId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  private normalizeName(name: string) {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!normalizedName) {
      throw new BadRequestException('Tag name is required');
    }
    return normalizedName;
  }

  private async ensureNoDuplicate(
    ownerId: string,
    name: string,
    type: TagType,
    excludedId?: string,
  ) {
    const queryBuilder = this.dataSource
      .getRepository(Tag)
      .createQueryBuilder('tag')
      .where('tag.ownerId = :ownerId', { ownerId })
      .andWhere('tag.type = :type', { type })
      .andWhere('LOWER(tag.name) = LOWER(:name)', { name });

    if (excludedId) {
      queryBuilder.andWhere('tag.id != :excludedId', { excludedId });
    }

    const existingTag = await queryBuilder.getOne();

    if (existingTag) {
      throw new BadRequestException(
        'A tag with this name and type already exists',
      );
    }
  }

  private toTagDto(tag: Tag) {
    return {
      id: tag.id,
      name: tag.name,
      type: tag.type,
      color: tag.color,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
