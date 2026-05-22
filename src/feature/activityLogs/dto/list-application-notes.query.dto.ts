import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { NoteType } from '../enums/note-type.enum';

const APPLICATION_NOTE_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'note_type',
  'is_private',
] as const;

export class ListApplicationNotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor-based pagination. ISO timestamp for created_at. When provided, cursor pagination is used and `sort_by` must be `created_at`.',
    example: '2026-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by note author user UUID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ enum: NoteType })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(NoteType)
  note_type?: NoteType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_private?: boolean;

  @ApiPropertyOptional({
    example: 'created_at',
    enum: APPLICATION_NOTE_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(APPLICATION_NOTE_SORT_FIELDS)
  override sort_by?: (typeof APPLICATION_NOTE_SORT_FIELDS)[number] = 'created_at';
}
