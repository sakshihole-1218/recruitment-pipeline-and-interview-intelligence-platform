import { ApiProperty } from '@nestjs/swagger';

export class SoftDeleteJobOpeningResponseDto {
  @ApiProperty({ example: 'b9b5d98d-4f82-4d87-8a84-0f4f6c9dfef2' })
  id: string;
}
