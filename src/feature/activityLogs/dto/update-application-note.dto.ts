import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { NoteType } from '../enums/note-type.enum';

export class UpdateApplicationNoteDto {
  @ApiPropertyOptional({ enum: NoteType, example: NoteType.INTERVIEWER_NOTE })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(NoteType)
  note_type?: NoteType;

  @ApiPropertyOptional({ example: 'Updated note text' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  note_text?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_private?: boolean;
}
