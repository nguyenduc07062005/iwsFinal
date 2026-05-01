import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskRagDto {
  @IsString({ message: 'Question must be text.' })
  @MinLength(2, { message: 'Question must be at least 2 characters.' })
  @MaxLength(1000, {
    message: 'Question cannot be longer than 1000 characters.',
  })
  question: string;
}
