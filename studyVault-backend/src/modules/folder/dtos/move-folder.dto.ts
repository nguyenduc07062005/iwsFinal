import { IsOptional, IsUUID } from 'class-validator';

export class MoveFolderDto {
  @IsUUID('4', { message: 'Folder id must be valid.' })
  folderId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent folder id must be valid.' })
  newParentId?: string;
}
