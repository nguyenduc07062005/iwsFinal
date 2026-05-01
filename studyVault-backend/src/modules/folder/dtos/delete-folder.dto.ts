import { IsUUID } from 'class-validator';

export class DeleteFolderDto {
  @IsUUID('4', { message: 'Folder id must be valid.' })
  folderId: string;
}
