import { IsUUID } from 'class-validator';

export class RemoveDocumentFromFolderDto {
  @IsUUID('4', { message: 'Folder id must be valid.' })
  folderId: string;

  @IsUUID('4', { message: 'Document id must be valid.' })
  documentId: string;
}
