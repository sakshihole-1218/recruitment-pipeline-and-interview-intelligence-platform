import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: '6d0b5c72-3e4d-4d36-a070-1d8f1e4b7c67' })
  id: string;

  @ApiProperty({ example: 'Recruiter' })
  name: string;

  @ApiProperty({ example: 'RECRUITER' })
  code: string;

  @ApiPropertyOptional({
    example: 'Handles candidate pipeline and coordination',
  })
  description: string | null;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-02T12:00:00.000Z' })
  updated_at: Date;
}
