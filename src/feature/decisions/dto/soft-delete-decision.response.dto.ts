import { ApiProperty } from '@nestjs/swagger';

export class SoftDeleteDecisionResponseDto {
  @ApiProperty({ description: 'Decision UUID' })
  id: string;
}
