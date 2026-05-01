import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateDocumentNameDto {
  @IsString({ message: 'Document name must be text.' })
  @IsNotEmpty({ message: 'Document name is required.' })
  @MaxLength(160, {
    message: 'Document name cannot be longer than 160 characters.',
  })
  newDocumentName: string;
}
