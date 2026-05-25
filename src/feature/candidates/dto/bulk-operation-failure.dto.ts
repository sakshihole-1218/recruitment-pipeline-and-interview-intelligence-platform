import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkOperationFailureDto {
  @ApiPropertyOptional({
    description: 'Index of the item in the input array (when applicable)',
    example: 0,
  })
  index?: number;

  @ApiPropertyOptional({ description: 'Candidate UUID', example: '8f7f3de0-1c2b-4e88-9b26-2f1a4d7c7e33' })
  candidate_id?: string;

  @ApiPropertyOptional({ description: 'Candidate email (when applicable)', example: 'sakshi@example.com' })
  email?: string;

  @ApiProperty({ description: 'Human readable error message', example: 'Candidate not found' })
  message: string;

  @ApiProperty({ description: 'Stable error code for clients', example: 'CANDIDATE_NOT_FOUND' })
  code: string;

  @ApiPropertyOptional({ description: 'Additional error details', example: ['email must be an email'] })
  details?: unknown;
}
