import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { NoteType } from '../enums/note-type.enum';

export class CreateApplicationNoteDto {
  @ApiProperty({ enum: NoteType, example: NoteType.RECRUITER_NOTE })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(NoteType)
  note_type: NoteType;

  @ApiProperty({
    example:
      'Candidate seems strong in system design. Follow up on leadership experience.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  note_text: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_private?: boolean;
}
