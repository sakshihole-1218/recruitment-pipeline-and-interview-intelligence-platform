import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateResumeAiAnalysisDto {
  @ApiProperty({ description: 'Candidate document UUID (must be RESUME type)' })
  @IsUUID()
  candidate_document_id: string;

  @ApiProperty({
    description:
      'Extracted text from the resume document. (AI provider integration will replace this later.)',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  extracted_text: string;
}
