import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StudyNoteDto {
  @IsString({ message: 'content must be a string.' })
  @IsNotEmpty({ message: 'content is required.' })
  @MaxLength(4000, {
    message: 'content cannot be longer than 4000 characters.',
  })
  content: string;
}
