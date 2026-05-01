import { IsOptional, IsUUID } from 'class-validator';

export class MoveFolderByIdDto {
  @IsOptional()
  @IsUUID('4', { message: 'Parent folder id must be valid.' })
  newParentId?: string;
}
