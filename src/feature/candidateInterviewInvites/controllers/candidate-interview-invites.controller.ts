import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { InterviewerAccessValidationHelper } from '../../../common/authorization/interviewer-access-validation.helper';
import { CandidateInterviewInvitesService } from '../application/services/candidate-interview-invites.service';
import { CreateCandidateInterviewInviteDto } from '../dto/create-candidate-interview-invite.dto';
import { CandidateInterviewInviteResponseDto } from '../dto/candidate-interview-invite.response.dto';
import { CandidateInterviewInvitesMapper } from '../helpers/candidate-interview-invites.mapper';

@ApiTags('Candidate Interview Invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('candidate-interview-invites')
export class CandidateInterviewInvitesController {
  constructor(
    private readonly service: CandidateInterviewInvitesService,
    private readonly interviewerAccessValidationHelper: InterviewerAccessValidationHelper,
  ) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create secure candidate interview invite' })
  @ApiStandardResponse(
    CandidateInterviewInviteResponseDto,
    'Candidate interview invite created successfully',
  )
  async create(
    @Body() dto: CreateCandidateInterviewInviteDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.service.create(dto.interview_id, actor?.sub);
    return ResponseUtil.success(
      'Candidate interview invite created successfully',
      CandidateInterviewInvitesMapper.toResponse(result.invite, {
        raw_token: result.rawToken,
        join_url: CandidateInterviewInvitesMapper.buildJoinUrl(result.rawToken),
      }),
    );
  }

  @Post(':id/regenerate')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate secure candidate interview invite' })
  async regenerate(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.service.regenerate(id, actor?.sub);
    return ResponseUtil.success(
      'Candidate interview invite regenerated successfully',
      CandidateInterviewInvitesMapper.toResponse(result.invite, {
        raw_token: result.rawToken,
        join_url: CandidateInterviewInvitesMapper.buildJoinUrl(result.rawToken),
      }),
    );
  }

  @Patch(':id/revoke')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke candidate interview invite' })
  async revoke(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const invite = await this.service.revoke(id, actor?.sub);
    return ResponseUtil.success(
      'Candidate interview invite revoked successfully',
      CandidateInterviewInvitesMapper.toResponse(invite),
    );
  }

  @Get('interview/:interviewId')
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'interviewId' })
  @ApiOperation({ summary: 'Get latest candidate interview invite for interview' })
  async getByInterviewId(
    @Param('interviewId') interviewId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.interviewerAccessValidationHelper.assertCanAccessInterview(
      actor,
      interviewId,
    );
    const invite = await this.service.getByInterviewId(interviewId);
    return ResponseUtil.success(
      'Candidate interview invite fetched successfully',
      invite ? CandidateInterviewInvitesMapper.toResponse(invite) : null,
    );
  }
}
