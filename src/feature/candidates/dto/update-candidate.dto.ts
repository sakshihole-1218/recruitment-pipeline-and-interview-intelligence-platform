import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  normalizeEmail,
  normalizePhoneE164,
  normalizeSearch,
} from '../../../common/utils/normalization.util';
import { CandidateGender } from '../enums/candidate-gender.enum';
import { CandidateSourceType } from '../enums/candidate-source-type.enum';

export class UpdateCandidateDto {
  @ApiPropertyOptional({ example: 'Sakshi' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'sakshi@example.com' })
  @IsOptional()
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @Transform(({ value }) => normalizePhoneE164(value))
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({
    example: '1998-05-10',
    description: 'ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    enum: CandidateGender,
    example: CandidateGender.FEMALE,
  })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(CandidateGender)
  gender?: CandidateGender;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(80)
  total_experience_years?: number;

  @ApiPropertyOptional({ example: 'Contoso' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(200)
  current_company?: string;

  @ApiPropertyOptional({ example: 'Backend Engineer' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(200)
  current_job_title?: string;

  @ApiPropertyOptional({ example: 'Bengaluru, IN' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(255)
  current_location?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  notice_period_days?: number;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  current_salary?: number;

  @ApiPropertyOptional({ example: 2500000 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  expected_salary?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : String(value).trim().toUpperCase(),
  )
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency_code?: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/sakshi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin_url?: string;

  @ApiPropertyOptional({ example: 'https://github.com/sakshi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  github_url?: string;

  @ApiPropertyOptional({ example: 'https://sakshi.dev' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  portfolio_url?: string;

  @ApiPropertyOptional({ example: 'Backend engineer with 5+ years in Node.js' })
  @IsOptional()
  @Transform(({ value }) => normalizeSearch(value))
  @IsString()
  @MaxLength(250)
  resume_headline?: string;

  @ApiPropertyOptional({
    enum: CandidateSourceType,
    example: CandidateSourceType.LINKEDIN,
  })
  @IsOptional()
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(CandidateSourceType)
  source_type?: CandidateSourceType;

  @ApiPropertyOptional({ example: 'Referred by John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  source_details?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}
