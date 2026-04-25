import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { RoleResponseDto } from '../dto/role.response.dto';
import { ListRolesQueryDto } from '../dto/list-roles.query.dto';
import { AccessControlMapper } from '../helpers/access-control.mapper';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { RolesService } from '../application/services/roles.service';

@ApiTags('Access Control - Roles')
@Controller('access-control/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
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
