import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';
import { InterviewerReviewStatus } from '../enums/interviewer-review-status.enum';

export class UpdateInterviewerReviewDto {
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

  @ApiPropertyOptional({ enum: InterviewerReviewStatus })
  @IsOptional()
  @IsEnum(InterviewerReviewStatus)
  review_status?: InterviewerReviewStatus;
}
