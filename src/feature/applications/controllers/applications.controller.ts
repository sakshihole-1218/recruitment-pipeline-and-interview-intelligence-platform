import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

import { ApplicationsService } from '../application/services/applications.service';
import { ApiApplicationsPaginatedResponse } from '../decorators/api-applications-paginated-response.decorator';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { ApplicationResponseDto } from '../dto/application.response.dto';
import { ListApplicationsQueryDto } from '../dto/list-applications.query.dto';
import { MoveApplicationStageDto } from '../dto/move-application-stage.dto';
import { RejectApplicationDto } from '../dto/reject-application.dto';
import { HoldApplicationDto } from '../dto/hold-application.dto';
import { WithdrawApplicationDto } from '../dto/withdraw-application.dto';
import { ApplicationStageHistoryResponseDto } from '../dto/application-stage-history.response.dto';
import { ApplicationsMapper } from '../helpers/applications.mapper';

@ApiTags('Applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create candidate application' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiStandardResponse(ApplicationResponseDto, 'Application created successfully')
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Application created successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application by id' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiStandardResponse(ApplicationResponseDto, 'Application fetched successfully')
  async findById(@Param('id') id: string) {
    const app = await this.applicationsService.findById(id);
    return ResponseUtil.success(
      'Application fetched successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List applications (offset or cursor pagination)' })
  @ApiApplicationsPaginatedResponse(ApplicationResponseDto, 'Applications fetched successfully')
  async list(@Query() query: ListApplicationsQueryDto) {
    const result = await this.applicationsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Applications fetched successfully', {
        data: result.data.map(ApplicationsMapper.toApplicationResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Applications fetched successfully',
      result.data.map(ApplicationsMapper.toApplicationResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Post(':id/move-stage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move application stage (controlled transitions)' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: MoveApplicationStageDto })
  @ApiStandardResponse(ApplicationResponseDto, 'Application stage updated successfully')
  async moveStage(
    @Param('id') id: string,
    @Body() dto: MoveApplicationStageDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.moveStage(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Application stage updated successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an application' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: RejectApplicationDto })
  @ApiStandardResponse(ApplicationResponseDto, 'Application rejected successfully')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.reject(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Application rejected successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Post(':id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Put an application on hold' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: HoldApplicationDto })
  @ApiStandardResponse(ApplicationResponseDto, 'Application put on hold successfully')
  async hold(
    @Param('id') id: string,
    @Body() dto: HoldApplicationDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.hold(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Application put on hold successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: WithdrawApplicationDto })
  @ApiStandardResponse(ApplicationResponseDto, 'Application withdrawn successfully')
  async withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawApplicationDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.withdraw(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Application withdrawn successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Get(':id/stage-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application stage history' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiExtraModels(BaseResponseDto, ApplicationStageHistoryResponseDto)
  @ApiOkResponse({
    description: 'Application stage history fetched successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ApplicationStageHistoryResponseDto) },
            },
          },
        },
      ],
    },
  })
  async stageHistory(@Param('id') id: string) {
    const rows = await this.applicationsService.listStageHistory(id);
    return ResponseUtil.success(
      'Application stage history fetched successfully',
      rows.map(ApplicationsMapper.toStageHistoryResponse),
    );
  }
}
