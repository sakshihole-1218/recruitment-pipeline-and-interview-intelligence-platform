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
import { DepartmentsService } from '../application/services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { UpdateDepartmentStatusDto } from '../dto/update-department-status.dto';
import { DepartmentResponseDto } from '../dto/department.response.dto';
import { ListDepartmentsQueryDto } from '../dto/list-departments.query.dto';
import { SoftDeleteDepartmentResponseDto } from '../dto/soft-delete-department.response.dto';
import { ApiDepartmentsPaginatedResponse } from '../decorators/api-departments-paginated-response.decorator';
import { DepartmentsMapper } from '../helpers/departments.mapper';

@ApiTags('Departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create department' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiStandardResponse(DepartmentResponseDto, 'Department created successfully')
  async create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const department = await this.departmentsService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Department created successfully',
      DepartmentsMapper.toResponse(department),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiStandardResponse(DepartmentResponseDto, 'Department updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const department = await this.departmentsService.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Department updated successfully',
      DepartmentsMapper.toResponse(department),
    );
  }

  @Patch(':id/status')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate/deactivate department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiBody({ type: UpdateDepartmentStatusDto })
  @ApiStandardResponse(
    DepartmentResponseDto,
    'Department status updated successfully',
  )
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentStatusDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const department = await this.departmentsService.updateStatus(
      id,
      dto,
      actor?.sub,
    );

    return ResponseUtil.success(
      'Department status updated successfully',
      DepartmentsMapper.toResponse(department),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get department by id' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiStandardResponse(DepartmentResponseDto, 'Department fetched successfully')
  async findById(@Param('id') id: string) {
    const department = await this.departmentsService.findById(id);
    return ResponseUtil.success(
      'Department fetched successfully',
      DepartmentsMapper.toResponse(department),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List departments (offset or cursor pagination)' })
  @ApiDepartmentsPaginatedResponse(
    DepartmentResponseDto,
    'Departments fetched successfully',
  )
  async list(@Query() query: ListDepartmentsQueryDto) {
    const result = await this.departmentsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Departments fetched successfully', {
        data: result.data.map(DepartmentsMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Departments fetched successfully',
      result.data.map(DepartmentsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiStandardResponse(
    SoftDeleteDepartmentResponseDto,
    'Department deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.departmentsService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Department deleted successfully', { id });
  }
}
