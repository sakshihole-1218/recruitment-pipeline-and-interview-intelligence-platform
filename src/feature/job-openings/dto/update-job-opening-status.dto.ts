import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { JobOpeningStatus } from '../enums/job-opening-status.enum';

export class UpdateJobOpeningStatusDto {
  @ApiProperty({ enum: JobOpeningStatus, example: JobOpeningStatus.OPEN })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  )
  @IsEnum(JobOpeningStatus)
  status: JobOpeningStatus;
}
