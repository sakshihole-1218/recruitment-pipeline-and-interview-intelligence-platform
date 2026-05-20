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
  Put,
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
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { JobOpeningsService } from '../application/services/job-openings.service';
import { ApiJobOpeningsPaginatedResponse } from '../decorators/api-job-openings-paginated-response.decorator';
import { CreateJobOpeningDto } from '../dto/create-job-opening.dto';
import { JobOpeningResponseDto } from '../dto/job-opening.response.dto';
import { ListJobOpeningsQueryDto } from '../dto/list-job-openings.query.dto';
import { ReplaceJobOpeningSkillsDto } from '../dto/replace-job-opening-skills.dto';
import { SoftDeleteJobOpeningResponseDto } from '../dto/soft-delete-job-opening.response.dto';
import { UpdateJobOpeningDto } from '../dto/update-job-opening.dto';
import { JobOpeningsMapper } from '../helpers/job-openings.mapper';

@ApiTags('Job Openings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('job-openings')
export class JobOpeningsController {
  constructor(private readonly jobOpeningsService: JobOpeningsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create job opening' })
  @ApiBody({ type: CreateJobOpeningDto })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening created successfully')
  async create(
    @Body() dto: CreateJobOpeningDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const opening = await this.jobOpeningsService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Job opening created successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update job opening fields (skills via /:id/skills)' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiBody({ type: UpdateJobOpeningDto })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobOpeningDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const opening = await this.jobOpeningsService.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Job opening updated successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get job opening by id' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening fetched successfully')
  async findById(@Param('id') id: string) {
    const opening = await this.jobOpeningsService.findById(id);
    return ResponseUtil.success(
      'Job opening fetched successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List job openings (offset or cursor pagination)' })
  @ApiJobOpeningsPaginatedResponse(
    JobOpeningResponseDto,
    'Job openings fetched successfully',
  )
  async list(@Query() query: ListJobOpeningsQueryDto) {
    const result = await this.jobOpeningsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Job openings fetched successfully', {
        data: result.data.map(JobOpeningsMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Job openings fetched successfully',
      result.data.map(JobOpeningsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Post(':id/publish')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening published successfully')
  async publish(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const opening = await this.jobOpeningsService.publish(id, actor?.sub);
    return ResponseUtil.success(
      'Job opening published successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Post(':id/unpublish')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(
    JobOpeningResponseDto,
    'Job opening unpublished successfully',
  )
  async unpublish(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const opening = await this.jobOpeningsService.unpublish(id, actor?.sub);
    return ResponseUtil.success(
      'Job opening unpublished successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Post(':id/open')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening opened successfully')
  async open(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const opening = await this.jobOpeningsService.open(id, actor?.sub);
    return ResponseUtil.success(
      'Job opening opened successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Post(':id/close')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(JobOpeningResponseDto, 'Job opening closed successfully')
  async close(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const opening = await this.jobOpeningsService.close(id, actor?.sub);
    return ResponseUtil.success(
      'Job opening closed successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Put(':id/skills')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace job opening skills' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiBody({ type: ReplaceJobOpeningSkillsDto })
  @ApiStandardResponse(
    JobOpeningResponseDto,
    'Job opening skills updated successfully',
  )
  async replaceSkills(
    @Param('id') id: string,
    @Body() dto: ReplaceJobOpeningSkillsDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const opening = await this.jobOpeningsService.replaceSkills(
      id,
      dto,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Job opening skills updated successfully',
      JobOpeningsMapper.toResponse(opening),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete job opening' })
  @ApiParam({ name: 'id', description: 'Job opening UUID' })
  @ApiStandardResponse(
    SoftDeleteJobOpeningResponseDto,
    'Job opening deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.jobOpeningsService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Job opening deleted successfully', { id });
  }
}
