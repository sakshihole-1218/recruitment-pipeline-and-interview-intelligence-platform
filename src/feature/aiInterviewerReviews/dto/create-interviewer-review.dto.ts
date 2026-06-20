import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';

export class CreateInterviewerReviewDto {
  @ApiProperty({ description: 'AI interview session UUID' })
  @IsUUID()
  ai_interview_session_id: string;

  @ApiPropertyOptional({ description: 'AI interview feedback UUID' })
  @IsOptional()
  @IsUUID()
  ai_interview_feedback_id?: string;

  @ApiProperty({ description: 'Reviewer user UUID' })
  @IsUUID()
  reviewer_user_id: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 82.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  technical_score?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 78 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  communication_score?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 80 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  problem_solving_score?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 74 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  culture_fit_score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  concerns?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detailed_review?: string;

  @ApiPropertyOptional({ enum: InterviewerRecommendation })
  @IsOptional()
  @IsEnum(InterviewerRecommendation)
  interviewer_recommendation?: InterviewerRecommendation;

  @ApiPropertyOptional({
    enum: InterviewerReviewStatus,
    default: InterviewerReviewStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(InterviewerReviewStatus)
  review_status?: InterviewerReviewStatus;
}
