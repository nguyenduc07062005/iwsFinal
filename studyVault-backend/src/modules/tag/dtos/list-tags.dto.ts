import { IsEnum, IsOptional } from 'class-validator';
import { TagType } from 'src/database/entities/tag.entity';

export class ListTagsDto {
  @IsOptional()
  @IsEnum(TagType, {
    message: 'type must be one of: SUBJECT, TOPIC, PURPOSE, TAG.',
  })
  type?: TagType;
}
