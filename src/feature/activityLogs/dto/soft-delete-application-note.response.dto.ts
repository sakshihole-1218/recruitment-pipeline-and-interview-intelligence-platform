import { ApiProperty } from '@nestjs/swagger';

export class SoftDeleteApplicationNoteResponseDto {
  @ApiProperty({ description: 'Deleted note UUID' })
  id: string;
}
