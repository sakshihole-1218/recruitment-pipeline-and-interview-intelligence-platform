import {
  Body,
  Controller,
  Delete,
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

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { DecisionsService } from '../application/services/decisions.service';
import { CreateApplicationDecisionDto } from '../dto/create-application-decision.dto';
import { UpdateApplicationDecisionDto } from '../dto/update-application-decision.dto';
import { ListDecisionsQueryDto } from '../dto/list-decisions.query.dto';
import { ApplicationDecisionResponseDto } from '../dto/application-decision.response.dto';
import { SoftDeleteDecisionResponseDto } from '../dto/soft-delete-decision.response.dto';
import { ApiDecisionsPaginatedResponse } from '../decorators/api-decisions-paginated-response.decorator';
import { DecisionsMapper } from '../helpers/decisions.mapper';

@ApiTags('Decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create final application decision' })
  @ApiBody({ type: CreateApplicationDecisionDto })
  @ApiStandardResponse(
    ApplicationDecisionResponseDto,
    'Decision created successfully',
  )
  async create(
    @Body() dto: CreateApplicationDecisionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const decision = await this.decisionsService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Decision created successfully',
      DecisionsMapper.toDecisionResponse(decision),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application decision' })
  @ApiParam({ name: 'id', description: 'Decision UUID' })
  @ApiBody({ type: UpdateApplicationDecisionDto })
  @ApiStandardResponse(
    ApplicationDecisionResponseDto,
    'Decision updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDecisionDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const decision = await this.decisionsService.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Decision updated successfully',
      DecisionsMapper.toDecisionResponse(decision),
    );
  }

  @Get('application/:applicationId')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get decision by application id' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiStandardResponse(
    ApplicationDecisionResponseDto,
    'Decision fetched successfully',
  )
  async findByApplicationId(@Param('applicationId') applicationId: string) {
    const decision = await this.decisionsService.findByApplicationId(
      applicationId,
    );
    return ResponseUtil.success(
      'Decision fetched successfully',
      DecisionsMapper.toDecisionResponse(decision),
    );
  }

  @Get(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get decision by id' })
  @ApiParam({ name: 'id', description: 'Decision UUID' })
  @ApiStandardResponse(
    ApplicationDecisionResponseDto,
    'Decision fetched successfully',
  )
  async findById(@Param('id') id: string) {
    const decision = await this.decisionsService.findById(id);
    return ResponseUtil.success(
      'Decision fetched successfully',
      DecisionsMapper.toDecisionResponse(decision),
    );
  }

  @Get()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List decisions (offset or cursor pagination)' })
  @ApiDecisionsPaginatedResponse(
    ApplicationDecisionResponseDto,
    'Decisions fetched successfully',
  )
  async list(@Query() query: ListDecisionsQueryDto) {
    const result = await this.decisionsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Decisions fetched successfully', {
        data: result.data.map(DecisionsMapper.toDecisionResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Decisions fetched successfully',
      result.data.map(DecisionsMapper.toDecisionResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.HIRING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete decision' })
  @ApiParam({ name: 'id', description: 'Decision UUID' })
  @ApiStandardResponse(
    SoftDeleteDecisionResponseDto,
    'Decision deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.decisionsService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Decision deleted successfully', { id });
  }
}
