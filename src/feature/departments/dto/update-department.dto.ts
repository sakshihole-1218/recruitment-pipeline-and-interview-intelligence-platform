import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'ENG' })
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @Transform(({ value }) => (value === null ? null : String(value ?? '').trim()))
  @IsString()
  @MaxLength(5000)
  description?: string | null;

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
