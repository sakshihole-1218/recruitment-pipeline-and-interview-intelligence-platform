import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ResponseUtil } from '../../../common/utils/response.util';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { InterviewsService } from '../application/services/interviews.service';
import { CreateInterviewRoundDto } from '../dto/create-interview-round.dto';
import { GetInterviewRoundsByJobOpeningQueryDto } from '../dto/get-interview-rounds-by-job-opening.query.dto';
import { InterviewRoundResponseDto } from '../dto/interview-round.response.dto';
import { UpdateInterviewRoundDto } from '../dto/update-interview-round.dto';
import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ApiStandardArrayResponse } from '../decorators/api-standard-array-response.decorator';
import { InterviewsMapper } from '../helpers/interviews.mapper';

@ApiTags('Interviews - Rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('interviews/rounds')
export class InterviewRoundsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create interview round' })
  @ApiBody({ type: CreateInterviewRoundDto })
  @ApiStandardResponse(InterviewRoundResponseDto, 'Interview round created successfully')
  async create(
    @Body() dto: CreateInterviewRoundDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const round = await this.interviewsService.createInterviewRound(dto, actor?.sub);
    return ResponseUtil.success(
      'Interview round created successfully',
      InterviewsMapper.toInterviewRoundResponse(round),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update interview round' })
  @ApiParam({ name: 'id', description: 'Interview round UUID' })
  @ApiBody({ type: UpdateInterviewRoundDto })
  @ApiStandardResponse(InterviewRoundResponseDto, 'Interview round updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewRoundDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const round = await this.interviewsService.updateInterviewRound(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Interview round updated successfully',
      InterviewsMapper.toInterviewRoundResponse(round),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List interview rounds by job opening' })
  @ApiStandardArrayResponse(InterviewRoundResponseDto, 'Interview rounds fetched successfully')
  async listByJobOpening(@Query() query: GetInterviewRoundsByJobOpeningQueryDto) {
    const rounds = await this.interviewsService.getInterviewRoundsByJobOpening(query);
    return ResponseUtil.success(
      'Interview rounds fetched successfully',
      rounds.map(InterviewsMapper.toInterviewRoundResponse),
    );
  }
}
