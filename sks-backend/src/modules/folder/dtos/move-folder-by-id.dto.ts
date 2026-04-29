import { IsOptional, IsUUID } from 'class-validator';

export class MoveFolderByIdDto {
  @IsOptional()
  @IsUUID()
  newParentId?: string;
}
