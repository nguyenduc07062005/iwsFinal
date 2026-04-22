import {
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsObject,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsArray()
  @IsOptional()
  chunks?: string[];
}
