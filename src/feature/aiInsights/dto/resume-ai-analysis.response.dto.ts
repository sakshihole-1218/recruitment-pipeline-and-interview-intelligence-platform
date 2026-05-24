import { ApiProperty } from '@nestjs/swagger';

import { ResumeAiAnalysisStatus } from '../enums/resume-ai-analysis-status.enum';

export class ResumeAiAnalysisResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  candidate_document_id: string;

  @ApiProperty({ description: 'Extracted resume text used for analysis' })
  extracted_text: string;

  @ApiProperty({
    description: 'JSON payload of extracted skills',
    type: 'object',
    additionalProperties: true,
    example: {
      skills: ['TYPESCRIPT', 'NESTJS', 'POSTGRESQL'],
      total: 3,
    },
  })
  skills_extracted: unknown;

  @ApiProperty({ nullable: true })
  experience_summary: string | null;

  @ApiProperty({ nullable: true })
  education_summary: string | null;

  @ApiProperty({ nullable: true, description: '0-100 numeric fit score' })
  ai_fit_score: string | null;

  @ApiProperty({ enum: ResumeAiAnalysisStatus })
  analysis_status: ResumeAiAnalysisStatus;

  @ApiProperty({ nullable: true })
  analyzed_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
