import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFolderByIdDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
