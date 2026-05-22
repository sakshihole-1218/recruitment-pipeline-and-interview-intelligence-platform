import { ApiProperty } from '@nestjs/swagger';

import { NoteType } from '../enums/note-type.enum';

export class ApplicationNoteResponseDto {
  @ApiProperty({ description: 'Note UUID' })
  id: string;

  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ description: 'Author user UUID' })
  user_id: string;

  @ApiProperty({ enum: NoteType })
  note_type: NoteType;

  @ApiProperty()
  note_text: string;

  @ApiProperty({ example: false })
  is_private: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
