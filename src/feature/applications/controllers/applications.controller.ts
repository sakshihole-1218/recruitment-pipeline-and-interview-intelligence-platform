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
import { RejectApplicationDto } from '../dto/reject-application.dto';
import { HoldApplicationDto } from '../dto/hold-application.dto';
import { WithdrawApplicationDto } from '../dto/withdraw-application.dto';
import { BulkMoveApplicationStageDto } from '../dto/bulk-move-application-stage.dto';
import { BulkRejectApplicationsDto } from '../dto/bulk-reject-applications.dto';
import { BulkAssignRecruiterDto } from '../dto/bulk-assign-recruiter.dto';
import { BulkAssignHiringManagerDto } from '../dto/bulk-assign-hiring-manager.dto';
import { CompleteApplicationScreeningDto } from '../dto/complete-application-screening.dto';
import { ApplicationStageHistoryResponseDto } from '../dto/application-stage-history.response.dto';
import { BulkOperationResultResponseDto } from '../dto/bulk-operation-result.response.dto';
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
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create candidate application' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Application created successfully',
  )
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
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Application fetched successfully',
  )
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
  @ApiApplicationsPaginatedResponse(
    ApplicationResponseDto,
    'Applications fetched successfully',
  )
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

  @Post('bulk/move-stage')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk move application stage (partial success)' })
  @ApiBody({ type: BulkMoveApplicationStageDto })
  @ApiStandardResponse(
    BulkOperationResultResponseDto,
    'Bulk stage move processed',
  )
  async bulkMoveStage(
    @Body() dto: BulkMoveApplicationStageDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.applicationsService.bulkMoveStage(
      dto,
      actor?.sub,
    );
    return ResponseUtil.success('Bulk stage move processed', result);
  }

  @Post('bulk/reject')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk reject applications (partial success)' })
  @ApiBody({ type: BulkRejectApplicationsDto })
  @ApiStandardResponse(
    BulkOperationResultResponseDto,
    'Bulk rejection processed',
  )
  async bulkReject(
    @Body() dto: BulkRejectApplicationsDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.applicationsService.bulkReject(dto, actor?.sub);
    return ResponseUtil.success('Bulk rejection processed', result);
  }

  @Post('bulk/assign-recruiter')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk assign recruiter to applications (partial success)',
  })
  @ApiBody({ type: BulkAssignRecruiterDto })
  @ApiStandardResponse(
    BulkOperationResultResponseDto,
    'Bulk recruiter assignment processed',
  )
  async bulkAssignRecruiter(
    @Body() dto: BulkAssignRecruiterDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.applicationsService.bulkAssignRecruiter(
      dto,
      actor?.sub,
    );
    return ResponseUtil.success('Bulk recruiter assignment processed', result);
  }

  @Post('bulk/assign-hiring-manager')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk assign hiring manager to applications (partial success)',
  })
  @ApiBody({ type: BulkAssignHiringManagerDto })
  @ApiStandardResponse(
    BulkOperationResultResponseDto,
    'Bulk hiring manager assignment processed',
  )
  async bulkAssignHiringManager(
    @Body() dto: BulkAssignHiringManagerDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.applicationsService.bulkAssignHiringManager(
      dto,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Bulk hiring manager assignment processed',
      result,
    );
  }

  @Post(':id/reject')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an application' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: RejectApplicationDto })
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Application rejected successfully',
  )
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
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Put an application on hold' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: HoldApplicationDto })
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Application put on hold successfully',
  )
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
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: WithdrawApplicationDto })
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Application withdrawn successfully',
  )
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
              items: {
                $ref: getSchemaPath(ApplicationStageHistoryResponseDto),
              },
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

  @Post(':id/start-screening')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start application screening (APPLIED -> SCREENING)',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiStandardResponse(ApplicationResponseDto, 'Screening started successfully')
  async startScreening(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.startScreening(id, actor?.sub);
    return ResponseUtil.success(
      'Screening started successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }

  @Post(':id/complete-screening')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete application screening (SCREENING -> result stage)',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiBody({ type: CompleteApplicationScreeningDto })
  @ApiStandardResponse(
    ApplicationResponseDto,
    'Screening completed successfully',
  )
  async completeScreening(
    @Param('id') id: string,
    @Body() dto: CompleteApplicationScreeningDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const app = await this.applicationsService.completeScreening(
      id,
      dto,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Screening completed successfully',
      ApplicationsMapper.toApplicationResponse(app),
    );
  }
}
