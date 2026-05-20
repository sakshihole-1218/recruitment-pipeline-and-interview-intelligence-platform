import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';

import { InterviewPanelRole } from '../enums/interview-panel-role.enum';

export class InterviewPanelMemberInputDto {
  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: InterviewPanelRole })
  @IsEnum(InterviewPanelRole)
  role_in_panel: InterviewPanelRole;
}

export class AssignInterviewPanelMembersDto {
  @ApiProperty({ type: [InterviewPanelMemberInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InterviewPanelMemberInputDto)
  members: InterviewPanelMemberInputDto[];
}
