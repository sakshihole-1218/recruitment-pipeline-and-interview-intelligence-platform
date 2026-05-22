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
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users.query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { AccessControlMapper } from '../helpers/access-control.mapper';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { UsersService } from '../application/services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SystemRoleCode } from '../enums/system-role-code.enum';

@ApiTags('Access Control - Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('access-control/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User created successfully')
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthJwtPayload) {
    const user = await this.usersService.create(dto, actor.sub);
    return ResponseUtil.success(
      'User created successfully',
      AccessControlMapper.toUserResponse(user),
    );
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const user = await this.usersService.update(id, dto, actor.sub);
    return ResponseUtil.success(
      'User updated successfully',
      AccessControlMapper.toUserResponse(user),
    );
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiStandardResponse(UserResponseDto, 'User fetched successfully')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ResponseUtil.success(
      'User fetched successfully',
      AccessControlMapper.toUserResponse(user),
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List users (offset or cursor pagination)' })
  @ApiPaginatedResponse(UserResponseDto, 'Users fetched successfully')
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.usersService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Users fetched successfully', {
        data: result.data.map(AccessControlMapper.toUserResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Users fetched successfully',
      result.data.map(AccessControlMapper.toUserResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Post(':id/roles/:roleId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiStandardResponse(UserResponseDto, 'Role assigned successfully')
  async assignRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const user = await this.usersService.assignRole(id, roleId, actor.sub);

    return ResponseUtil.success(
      'Role assigned successfully',
      AccessControlMapper.toUserResponse(user),
    );
  }

  @Delete(':id/roles/:roleId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiStandardResponse(UserResponseDto, 'Role removed successfully')
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const user = await this.usersService.removeRole(id, roleId, actor.sub);

    return ResponseUtil.success(
      'Role removed successfully',
      AccessControlMapper.toUserResponse(user),
    );
  }
}
