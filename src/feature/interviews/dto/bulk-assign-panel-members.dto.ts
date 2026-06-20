import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkAssignPanelMembersDto {
  @ApiProperty({ type: [String], description: 'Interview UUIDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  interview_ids: string[];

  @ApiProperty({
    type: [String],
    description: 'User UUIDs to add as panel members',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  panel_member_user_ids: string[];
}
