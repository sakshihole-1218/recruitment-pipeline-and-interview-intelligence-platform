import { ApiProperty } from '@nestjs/swagger';

import { ActivityActionType } from '../enums/activity-action-type.enum';
import { ActivityEntityType } from '../enums/activity-entity-type.enum';

export class ActivityLogResponseDto {
  @ApiProperty({ description: 'Activity log UUID' })
  id: string;

  @ApiProperty({ enum: ActivityEntityType })
  entity_type: ActivityEntityType;

  @ApiProperty({ description: 'Entity UUID' })
  entity_id: string;

  @ApiProperty({ enum: ActivityActionType })
  action_type: ActivityActionType;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  old_values: Record<string, unknown> | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  new_values: Record<string, unknown> | null;

  @ApiProperty({ description: 'Actor user UUID' })
  action_by_user_id: string;

  @ApiProperty()
  action_at: Date;

  @ApiProperty({ nullable: true })
  ip_address: string | null;

  @ApiProperty({ nullable: true })
  user_agent: string | null;

  @ApiProperty()
  created_at: Date;
}
