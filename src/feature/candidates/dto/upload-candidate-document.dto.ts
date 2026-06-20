import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { CandidateDocumentType } from '../enums/candidate-document-type.enum';

export class UploadCandidateDocumentDto {
  @ApiProperty({
    enum: CandidateDocumentType,
    example: CandidateDocumentType.RESUME,
  })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(CandidateDocumentType)
  document_type: CandidateDocumentType;

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
