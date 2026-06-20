import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Candidate UUID' })
  @IsUUID()
  candidate_id: string;

  @ApiProperty({ description: 'Job opening UUID' })
  @IsUUID()
  job_opening_id: string;

  @ApiPropertyOptional({ description: 'Assigned recruiter user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_recruiter_user_id?: string;

  @ApiPropertyOptional({ description: 'Assigned hiring manager user UUID' })
  @IsOptional()
  @IsUUID()
  assigned_hiring_manager_user_id?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_priority?: boolean;
}
