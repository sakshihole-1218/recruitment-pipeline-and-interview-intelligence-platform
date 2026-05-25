import { ApiProperty } from '@nestjs/swagger';

export class BulkScheduleInterviewsFailureDto {
  @ApiProperty({ description: 'Application UUID' })
  application_id: string;

  @ApiProperty({ example: 'Application stage invalid' })
  reason: string;
}

export class BulkInterviewOperationFailureDto {
  @ApiProperty({ description: 'Interview UUID' })
  interview_id: string;

  @ApiProperty({ example: 'Interview not found' })
  reason: string;
}

export class BulkScheduleInterviewsResultResponseDto {
  @ApiProperty({ example: 45 })
  success_count: number;

  @ApiProperty({ example: 3 })
  failed_count: number;

  @ApiProperty({
    type: [String],
    description: 'Successful application IDs (same identifiers as the input array)',
  })
  successful_ids: string[];

  @ApiProperty({ type: [BulkScheduleInterviewsFailureDto] })
  failures: BulkScheduleInterviewsFailureDto[];
}

export class BulkAssignPanelMembersResultResponseDto {
  @ApiProperty({ example: 45 })
  success_count: number;

  @ApiProperty({ example: 3 })
  failed_count: number;

  @ApiProperty({
    type: [String],
    description: 'Successful interview IDs (same identifiers as the input array)',
  })
  successful_ids: string[];

  @ApiProperty({ type: [BulkInterviewOperationFailureDto] })
  failures: BulkInterviewOperationFailureDto[];
}

export class BulkCancelInterviewsResultResponseDto {
  @ApiProperty({ example: 45 })
  success_count: number;

  @ApiProperty({ example: 3 })
  failed_count: number;

  @ApiProperty({
    type: [String],
    description: 'Successful interview IDs (same identifiers as the input array)',
  })
  successful_ids: string[];

  @ApiProperty({ type: [BulkInterviewOperationFailureDto] })
  failures: BulkInterviewOperationFailureDto[];
}
