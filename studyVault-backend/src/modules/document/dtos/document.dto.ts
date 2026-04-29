import {
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsObject,
  IsUUID,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const toTagIds = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return (value as unknown[])
      .map((tagId) => (typeof tagId === 'string' ? tagId.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tagId) => tagId.trim())
      .filter(Boolean);
  }

  return undefined;
};

export class MetadataDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  methodology?: string;

  [key: string]: any;
}

export class DocumentDto {
  @IsString({ message: 'title must be a string.' })
  @IsOptional()
  title?: string;

  @IsOptional()
  @IsObject()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;

  @IsDateString({}, { message: 'docDate must be a valid ISO date string.' })
  @IsOptional()
  docDate?: Date;

  @IsOptional()
  @IsObject()
  extraAttributes?: Record<string, any>;

  @IsString({ message: 'fileRef must be a string.' })
  @IsOptional()
  fileRef?: string;

  @IsOptional()
  @IsInt({ message: 'fileSize must be an integer number of bytes.' })
  @Min(0, { message: 'fileSize cannot be negative.' })
  fileSize?: number;

  @IsOptional()
  @IsUUID('4', { message: 'folderId must be a valid folder id.' })
  folderId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toTagIds(value))
  @IsArray({ message: 'tagIds must be an array.' })
  @ArrayMaxSize(12, { message: 'A document can have up to 12 tags.' })
  @IsUUID('4', { each: true, message: 'Each tag id must be a valid uuid.' })
  tagIds?: string[];

  @IsArray()
  @IsOptional()
  chunks?: string[];
}
