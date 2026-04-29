import {
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TagType } from 'src/database/entities/tag.entity';

export class UpdateTagDto {
  @IsOptional()
  @IsString({ message: 'name must be a string.' })
  @MaxLength(80, { message: 'name cannot be longer than 80 characters.' })
  name?: string;

  @IsOptional()
  @IsEnum(TagType, {
    message: 'type must be one of: SUBJECT, TOPIC, PURPOSE, TAG.',
  })
  type?: TagType;

  @IsOptional()
  @IsHexColor({ message: 'color must be a valid hex color.' })
  color?: string;
}
