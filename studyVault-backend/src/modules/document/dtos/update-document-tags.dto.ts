import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class UpdateDocumentTagsDto {
  @IsArray({ message: 'tagIds must be an array.' })
  @ArrayMaxSize(12, { message: 'A document can have up to 12 tags.' })
  @IsUUID('4', { each: true, message: 'Each tag id must be a valid uuid.' })
  tagIds: string[];
}
