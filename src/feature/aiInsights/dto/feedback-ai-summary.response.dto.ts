import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ enum: FinalAiRecommendation })
  final_ai_recommendation: FinalAiRecommendation;

  @ApiProperty()
  generated_at: Date;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
