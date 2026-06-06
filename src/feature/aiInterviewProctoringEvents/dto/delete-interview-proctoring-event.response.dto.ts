import { ApiProperty } from '@nestjs/swagger';

export class DeleteInterviewProctoringEventResponseDto {
  @ApiProperty({ example: '3bd49007-cc4d-4068-9479-c6cda4ac32f1' })
  id: string;
}
