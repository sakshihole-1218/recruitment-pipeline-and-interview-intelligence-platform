import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CandidateDocumentType } from '../enums/candidate-document-type.enum';

export class CreateCandidateDocumentMetadataDto {
  @ApiProperty({ enum: CandidateDocumentType, example: CandidateDocumentType.RESUME })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsEnum(CandidateDocumentType)
  document_type: CandidateDocumentType;

  @ApiProperty({ example: 'sakshi_resume.pdf' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ example: 'https://cdn.example.com/candidates/123/resume.pdf' })
  @IsString()
  @MinLength(1)
  file_url: string;

  @ApiPropertyOptional({ example: 345678 })
  @IsOptional()
  @Type(() => Number)
  file_size?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mime_type?: string;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  uploaded_at?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Only applicable for RESUME documents',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_latest?: boolean;
}
