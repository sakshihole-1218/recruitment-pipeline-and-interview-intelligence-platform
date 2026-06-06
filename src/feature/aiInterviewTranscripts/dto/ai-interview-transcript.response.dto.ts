import { ApiProperty } from '@nestjs/swagger';

import { TranscriptSpeakerType } from '../enums/transcript-speaker-type.enum';

export class AiInterviewTranscriptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty({ nullable: true })
  ai_interview_question_id: string | null;

  @ApiProperty({ enum: TranscriptSpeakerType })
  speaker_type: TranscriptSpeakerType;

  @ApiProperty()
  message_text: string;

  @ApiProperty()
  sequence_number: number;

  @ApiProperty({ nullable: true })
  spoken_at: Date | null;

  @ApiProperty({ nullable: true, example: 0.9842 })
  speech_to_text_confidence: number | null;

  @ApiProperty({ type: Object, nullable: true, additionalProperties: true })
  raw_payload: Record<string, unknown> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ nullable: true })
  deleted_at: Date | null;

  @ApiProperty({ nullable: true })
  created_by_user_id: string | null;

  @ApiProperty({ nullable: true })
  updated_by_user_id: string | null;

  @ApiProperty({ nullable: true })
  deleted_by_user_id: string | null;
}
