import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

const toBoolean = ({
  value,
}: {
  value: unknown;
}): boolean | string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }

    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
};

const toTrimmedString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toLowercaseString = ({
  value,
}: {
  value: unknown;
}): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
};

export const DOCUMENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'docDate',
  'fileSize',
] as const;

export type DocumentSortField = (typeof DOCUMENT_SORT_FIELDS)[number];

export const DOCUMENT_SORT_ORDERS = ['asc', 'desc'] as const;

export type DocumentSortOrder = (typeof DOCUMENT_SORT_ORDERS)[number];

export const DOCUMENT_TYPE_FILTERS = [
  'pdf',
  'doc',
  'docx',
  'txt',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
] as const;

export type DocumentTypeFilter = (typeof DOCUMENT_TYPE_FILTERS)[number];

export class ListDocumentsDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt({ message: 'page must be an integer.' })
  @Min(1, { message: 'page must be at least 1.' })
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt({ message: 'limit must be an integer.' })
  @Min(1, { message: 'limit must be at least 1.' })
  @Max(50, { message: 'limit cannot be greater than 50.' })
  limit?: number;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsIn(DOCUMENT_SORT_FIELDS, {
    message: `sortBy must be one of: ${DOCUMENT_SORT_FIELDS.join(', ')}.`,
  })
  sortBy?: DocumentSortField;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsIn(DOCUMENT_SORT_ORDERS, {
    message: `sortOrder must be one of: ${DOCUMENT_SORT_ORDERS.join(', ')}.`,
  })
  sortOrder?: DocumentSortOrder;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsUUID('4', { message: 'folderId must be a valid folder id.' })
  folderId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'favorite must be either true or false.' })
  favorite?: boolean;

  @IsOptional()
  @Transform(toLowercaseString)
  @IsIn(DOCUMENT_TYPE_FILTERS, {
    message: `type must be one of: ${DOCUMENT_TYPE_FILTERS.join(', ')}.`,
  })
  type?: DocumentTypeFilter;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString({ message: 'keyword must be a string.' })
  keyword?: string;
}
