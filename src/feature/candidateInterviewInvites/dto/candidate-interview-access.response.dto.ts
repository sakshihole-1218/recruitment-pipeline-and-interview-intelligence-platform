import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CandidateInterviewInviteStatus } from '../enums/candidate-interview-invite-status.enum';

class CandidateInterviewAccessCandidateDto {
  @ApiProperty()
  full_name: string;
}

class CandidateInterviewAccessJobDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  code: string;
}

class CandidateInterviewAccessRoundDto {
  @ApiProperty()
  round_name: string;
}

class CandidateInterviewAccessSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  interview_id: string;

  @ApiProperty()
  session_status: string;

  @ApiProperty()
  question_generation_status: string;

  @ApiProperty()
  feedback_generation_status: string;
}

export class CandidateInterviewAccessResponseDto {
  @ApiProperty()
  invite_id: string;

  @ApiProperty({ enum: CandidateInterviewInviteStatus })
  invite_status: CandidateInterviewInviteStatus;

  @ApiProperty()
  interview_id: string;

  @ApiProperty()
  scheduled_start_at: Date;

  @ApiProperty()
  scheduled_end_at: Date;

  @ApiProperty()
  estimated_duration_minutes: number;

  @ApiPropertyOptional({ nullable: true })
  valid_from: Date | null;

  @ApiProperty()
  expires_at: Date;

  @ApiPropertyOptional({ nullable: true })
  first_accessed_at: Date | null;

  @ApiPropertyOptional({ nullable: true })
  last_accessed_at: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completed_at: Date | null;

  @ApiProperty({ type: CandidateInterviewAccessCandidateDto })
  candidate: CandidateInterviewAccessCandidateDto;

  @ApiProperty({ type: CandidateInterviewAccessJobDto })
  job_opening: CandidateInterviewAccessJobDto;

  @ApiProperty({ type: CandidateInterviewAccessRoundDto })
  interview_round: CandidateInterviewAccessRoundDto;

  @ApiProperty({ type: CandidateInterviewAccessSessionDto })
  ai_interview_session: CandidateInterviewAccessSessionDto;

  @ApiProperty({ type: [String] })
  instructions: string[];
}
