import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { RoleResponseDto } from '../dto/role.response.dto';
import { ListRolesQueryDto } from '../dto/list-roles.query.dto';
import { AccessControlMapper } from '../helpers/access-control.mapper';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { RolesService } from '../application/services/roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRoleCode } from '../enums/system-role-code.enum';

@ApiTags('Access Control - Roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('access-control/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get roles' })
  @ApiPaginatedResponse(RoleResponseDto, 'Roles fetched successfully')
  async list(@Query() query: ListRolesQueryDto) {
    const result = await this.rolesService.list(query);

    return ResponseUtil.paginated(
      'Roles fetched successfully',
      result.data.map(AccessControlMapper.toRoleResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiStandardResponse(RoleResponseDto, 'Role fetched successfully')
  async findById(@Param('id') id: string) {
    const role = await this.rolesService.findById(id);

    return ResponseUtil.success(
      'Role fetched successfully',
      AccessControlMapper.toRoleResponse(role),
    );
  }
}
