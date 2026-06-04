import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ResumeAiAnalysisStatus } from '../enums/resume-ai-analysis-status.enum';

export class UpdateResumeAiAnalysisDto {
  @ApiPropertyOptional({ description: 'Extracted resume text' })
  @IsOptional()
  @IsString()
  extracted_text?: string;

  @ApiPropertyOptional({
    description: 'Parsed resume JSON (jsonb)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  parsed_resume_json?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Skills JSON (jsonb)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  skills_extracted?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience_summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  education_summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  project_summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certification_summary?: string;

  @ApiPropertyOptional({ description: 'Total experience years detected (numeric)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_experience_years_detected?: number;

  @ApiPropertyOptional({ description: '0-100 fit score' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  ai_fit_score?: number;

  @ApiPropertyOptional({ enum: ResumeAiAnalysisStatus })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(ResumeAiAnalysisStatus)
  analysis_status?: ResumeAiAnalysisStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failure_reason?: string;
}
