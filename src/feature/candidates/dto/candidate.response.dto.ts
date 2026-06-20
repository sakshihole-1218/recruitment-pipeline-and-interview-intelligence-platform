import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CandidateGender } from '../enums/candidate-gender.enum';
import { CandidateSourceType } from '../enums/candidate-source-type.enum';

export class CandidateResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;

  @ApiProperty({ example: 'Sakshi' })
  first_name: string;

  @ApiProperty({ example: 'Sharma' })
  last_name: string;

  @ApiProperty({ example: 'sakshi@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: '1998-05-10', nullable: true })
  date_of_birth: string | null;

  @ApiPropertyOptional({ enum: CandidateGender, nullable: true })
  gender: CandidateGender | null;

  @ApiPropertyOptional({ example: '5.50', nullable: true })
  total_experience_years: string | null;

  @ApiPropertyOptional({ example: 'Contoso', nullable: true })
  current_company: string | null;

  @ApiPropertyOptional({ example: 'Backend Engineer', nullable: true })
  current_job_title: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru, IN', nullable: true })
  current_location: string | null;

  @ApiPropertyOptional({ example: 30, nullable: true })
  notice_period_days: number | null;

  @ApiPropertyOptional({ example: '1500000.00', nullable: true })
  current_salary: string | null;

  @ApiPropertyOptional({ example: '2500000.00', nullable: true })
  expected_salary: string | null;

  @ApiPropertyOptional({ example: 'INR', nullable: true })
  currency_code: string | null;

  @ApiPropertyOptional({
    example: 'https://www.linkedin.com/in/sakshi',
    nullable: true,
  })
  linkedin_url: string | null;

  @ApiPropertyOptional({ example: 'https://github.com/sakshi', nullable: true })
  github_url: string | null;

  @ApiPropertyOptional({ example: 'https://sakshi.dev', nullable: true })
  portfolio_url: string | null;

  @ApiPropertyOptional({
    example: 'Backend engineer with 5+ years',
    nullable: true,
  })
  resume_headline: string | null;

  @ApiPropertyOptional({ enum: CandidateSourceType, nullable: true })
  source_type: CandidateSourceType | null;

  @ApiPropertyOptional({ example: 'Referred by John Doe', nullable: true })
  source_details: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updated_at: Date;
}
