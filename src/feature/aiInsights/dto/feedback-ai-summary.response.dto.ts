import { ApiProperty } from '@nestjs/swagger';

import { AiFeedbackSummaryStatus } from '../enums/ai-feedback-summary-status.enum';
import { FinalAiRecommendation } from '../enums/final-ai-recommendation.enum';

export class FeedbackAiSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  application_id: string;

  @ApiProperty()
  summary_text: string;

  @ApiProperty({ nullable: true })
  strengths_summary: string | null;

  @ApiProperty({ nullable: true })
  concerns_summary: string | null;

  @ApiProperty({ nullable: true })
  technical_summary: string | null;

  @ApiProperty({ nullable: true })
  communication_summary: string | null;

  @ApiProperty({ nullable: true })
  overall_score: string | null;

  @ApiProperty({ nullable: true })
  technical_score: string | null;

  @ApiProperty({ nullable: true })
  communication_score: string | null;

  @ApiProperty({ nullable: true })
  problem_solving_score: string | null;

  @ApiProperty({ nullable: true })
  culture_fit_score: string | null;

  @ApiProperty({ enum: FinalAiRecommendation })
  final_ai_recommendation: FinalAiRecommendation;

  @ApiProperty({ enum: AiFeedbackSummaryStatus, nullable: true })
  generation_status: AiFeedbackSummaryStatus | null;

  @ApiProperty({ nullable: true })
  failure_reason: string | null;

  @ApiProperty({ nullable: true })
  generated_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
