import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUMMARY_LANGUAGES, SUMMARY_VERSION_SLOTS } from '../types/rag.types';
import type { SummaryLanguage, SummaryVersionSlot } from '../types/rag.types';

export class GenerateSummaryDto {
  @IsOptional()
  @IsIn([...SUMMARY_LANGUAGES], {
    message: `Summary language must be one of: ${SUMMARY_LANGUAGES.join(', ')}.`,
  })
  language?: SummaryLanguage;

  @IsOptional()
  @IsBoolean({ message: 'forceRefresh must be either true or false.' })
  forceRefresh?: boolean;

  @IsOptional()
  @IsIn([...SUMMARY_VERSION_SLOTS], {
    message: `Summary slot must be one of: ${SUMMARY_VERSION_SLOTS.join(', ')}.`,
  })
  slot?: SummaryVersionSlot;

  @IsOptional()
  @IsString({ message: 'Summary instruction must be text.' })
  @MaxLength(1500, {
    message: 'Summary instruction cannot be longer than 1500 characters.',
  })
  instruction?: string;
}
