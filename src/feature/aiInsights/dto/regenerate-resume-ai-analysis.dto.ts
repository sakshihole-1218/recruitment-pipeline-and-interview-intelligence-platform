import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegenerateResumeAiAnalysisDto {
  @ApiPropertyOptional({
    description:
      'Optional new extracted text. If omitted, regeneration uses the currently stored extracted_text.',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  extracted_text?: string;
}
