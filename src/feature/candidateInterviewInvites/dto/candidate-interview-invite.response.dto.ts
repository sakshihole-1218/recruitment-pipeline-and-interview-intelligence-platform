import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CandidateInterviewInviteStatus } from '../enums/candidate-interview-invite-status.enum';

export class CandidateInterviewInviteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  interview_id: string;

  @ApiProperty()
  ai_interview_session_id: string;

  @ApiProperty()
  candidate_id: string;

  @ApiProperty({ enum: CandidateInterviewInviteStatus })
  status: CandidateInterviewInviteStatus;

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

  @ApiPropertyOptional({ nullable: true })
  revoked_at: Date | null;

  @ApiPropertyOptional({ nullable: true })
  join_url?: string;

  @ApiPropertyOptional({ nullable: true })
  raw_token?: string;

  @ApiPropertyOptional({ nullable: true })
  public_token?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
