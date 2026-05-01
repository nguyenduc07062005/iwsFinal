import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateFolderDto {
  @IsUUID('4', { message: 'Folder id must be valid.' })
  folderId: string;

  @IsString({ message: 'Folder name must be text.' })
  @IsNotEmpty({ message: 'Folder name is required.' })
  @MaxLength(80, {
    message: 'Folder name cannot be longer than 80 characters.',
  })
  name: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent folder id must be valid.' })
  parentId?: string;
}
