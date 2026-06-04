import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateResumeAiAnalysisDto {
  @ApiProperty({ description: 'Candidate document UUID (must be RESUME type)' })
  @IsUUID()
  candidate_document_id: string;

  @ApiPropertyOptional({ description: 'Optional application UUID for context/linking' })
  @IsOptional()
  @IsUUID()
  application_id?: string;

  @ApiPropertyOptional({
    description:
      'Optional extracted text for backward compatibility. Start/regenerate can run without this using the provider mock.',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  extracted_text?: string;
}
