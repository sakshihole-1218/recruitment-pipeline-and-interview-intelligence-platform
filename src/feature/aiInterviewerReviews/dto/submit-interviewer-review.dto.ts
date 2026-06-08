import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { InterviewerRecommendation } from '../enums/interviewer-recommendation.enum';

export class SubmitInterviewerReviewDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 82.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  technical_score: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 78 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  communication_score: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 80 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  problem_solving_score: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 74 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  culture_fit_score: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  concerns?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detailed_review: string;

  @ApiProperty({ enum: InterviewerRecommendation })
  @IsEnum(InterviewerRecommendation)
  interviewer_recommendation: InterviewerRecommendation;
}
