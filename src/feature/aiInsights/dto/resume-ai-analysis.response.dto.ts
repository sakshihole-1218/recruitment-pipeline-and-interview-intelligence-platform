import { ApiProperty } from '@nestjs/swagger';

import { ResumeAiAnalysisStatus } from '../enums/resume-ai-analysis-status.enum';

export class ResumeAiAnalysisResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty()
  candidate_document_id: string;

  @ApiProperty({ nullable: true })
  application_id: string | null;

  @ApiProperty({ description: 'Extracted resume text used for analysis' })
  extracted_text: string | null;

  @ApiProperty({
    description: 'Structured parsed resume JSON (jsonb)',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  parsed_resume_json: unknown | null;

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

  @ApiProperty({ nullable: true })
  project_summary: string | null;

  @ApiProperty({ nullable: true })
  certification_summary: string | null;

  @ApiProperty({ nullable: true, description: 'Detected total years (numeric)' })
  total_experience_years_detected: string | null;

  @ApiProperty({ nullable: true, description: '0-100 numeric fit score' })
  ai_fit_score: string | null;

  @ApiProperty({ enum: ResumeAiAnalysisStatus })
  analysis_status: ResumeAiAnalysisStatus;

  @ApiProperty({ nullable: true })
  failure_reason: string | null;

  @ApiProperty({ nullable: true })
  analyzed_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
