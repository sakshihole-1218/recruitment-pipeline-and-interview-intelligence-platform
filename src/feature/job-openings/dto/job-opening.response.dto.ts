import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EmploymentType } from '../enums/employment-type.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { JobOpeningStatus } from '../enums/job-opening-status.enum';
import { JobOpeningSkillResponseDto } from './job-opening-skill.response.dto';

export class JobOpeningResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  title: string;

  @ApiProperty({ example: 'BE-2026-001' })
  code: string;

  @ApiProperty({ description: 'Department UUID' })
  department_id: string;

  @ApiPropertyOptional({
    description: 'Department name',
    nullable: true,
    example: 'Engineering',
  })
  department_name: string | null;

  @ApiProperty({ description: 'Hiring manager user UUID' })
  hiring_manager_user_id: string;

  @ApiProperty({ description: 'Recruiter user UUID' })
  recruiter_user_id: string;

  @ApiProperty({ enum: EmploymentType })
  employment_type: EmploymentType;

  @ApiProperty({ enum: WorkMode })
  work_mode: WorkMode;

  @ApiPropertyOptional({ example: 3 })
  experience_min_years: number | null;

  @ApiPropertyOptional({ example: 7 })
  experience_max_years: number | null;

  @ApiPropertyOptional({ example: '1500000.00' })
  min_salary: string | null;

  @ApiPropertyOptional({ example: '2800000.00' })
  max_salary: string | null;

  @ApiPropertyOptional({ example: 'INR' })
  currency_code: string | null;

  @ApiProperty({ example: 2 })
  openings_count: number;

  @ApiPropertyOptional()
  job_description: string | null;

  @ApiPropertyOptional()
  responsibilities: string | null;

  @ApiPropertyOptional()
  requirements: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru, IN' })
  location: string | null;

  @ApiProperty({ enum: JobOpeningStatus })
  status: JobOpeningStatus;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  published_at: Date | null;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z', nullable: true })
  closed_at: Date | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: [JobOpeningSkillResponseDto] })
  skills?: JobOpeningSkillResponseDto[];
}
