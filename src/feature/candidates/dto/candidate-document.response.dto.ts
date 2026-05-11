import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CandidateDocumentType } from '../enums/candidate-document-type.enum';

export class CandidateDocumentResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ description: 'Candidate UUID' })
  candidate_id: string;

  @ApiProperty({ enum: CandidateDocumentType })
  document_type: CandidateDocumentType;

  @ApiProperty({ example: 'sakshi_resume.pdf' })
  file_name: string;

  @ApiProperty({ example: 'https://cdn.example.com/candidates/123/resume.pdf' })
  file_url: string;

  @ApiPropertyOptional({ example: '345678', nullable: true })
  file_size: string | null;

  @ApiPropertyOptional({ example: 'application/pdf', nullable: true })
  mime_type: string | null;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  uploaded_at: Date | null;

  @ApiProperty({ example: false })
  is_latest: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
