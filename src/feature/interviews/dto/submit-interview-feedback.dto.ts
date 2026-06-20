import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { InterviewRecommendation } from '../enums/interview-recommendation.enum';

export class SubmitInterviewFeedbackDto {
  @ApiProperty({ example: 8, minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  technical_score: number;

  @ApiProperty({ example: 7, minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  communication_score: number;

  @ApiProperty({ example: 8, minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  problem_solving_score: number;

  @ApiProperty({ example: 7, minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  culture_fit_score: number;

  @ApiPropertyOptional({
    example: 'Strong problem solving and clear communication',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  strengths?: string;

  @ApiPropertyOptional({
    example: 'Needs improvement in system design fundamentals',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  concerns?: string;

  @ApiPropertyOptional({
    example: 'Detailed notes about coding exercise and discussion',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20000)
  detailed_feedback?: string;

  @ApiProperty({ enum: InterviewRecommendation })
  @IsEnum(InterviewRecommendation)
  recommendation: InterviewRecommendation;
}
