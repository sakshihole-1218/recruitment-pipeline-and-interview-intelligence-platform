import { ApiProperty } from '@nestjs/swagger';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 57 })
  total_records: number;

  @ApiProperty({ example: 6 })
  total_pages: number;

  @ApiProperty({ example: true })
  has_next_page: boolean;

  @ApiProperty({ example: false })
  has_previous_page: boolean;
}

export class PaginatedResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Records fetched successfully' })
  message: string;

  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}