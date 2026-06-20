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
import { SkillsService } from '../application/services/skills.service';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { UpdateSkillStatusDto } from '../dto/update-skill-status.dto';
import { ListSkillsQueryDto } from '../dto/list-skills.query.dto';
import { SkillResponseDto } from '../dto/skill.response.dto';
import { SoftDeleteSkillResponseDto } from '../dto/soft-delete-skill.response.dto';
import { ApiSkillsPaginatedResponse } from '../decorators/api-skills-paginated-response.decorator';
import { SkillsMapper } from '../helpers/skills.mapper';

@ApiTags('Skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create skill' })
  @ApiBody({ type: CreateSkillDto })
  @ApiStandardResponse(SkillResponseDto, 'Skill created successfully')
  async create(
    @Body() dto: CreateSkillDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const skill = await this.skillsService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Skill created successfully',
      SkillsMapper.toResponse(skill),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update skill' })
  @ApiParam({ name: 'id', description: 'Skill UUID' })
  @ApiBody({ type: UpdateSkillDto })
  @ApiStandardResponse(SkillResponseDto, 'Skill updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const skill = await this.skillsService.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Skill updated successfully',
      SkillsMapper.toResponse(skill),
    );
  }

  @Patch(':id/status')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate/deactivate skill' })
  @ApiParam({ name: 'id', description: 'Skill UUID' })
  @ApiBody({ type: UpdateSkillStatusDto })
  @ApiStandardResponse(SkillResponseDto, 'Skill status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSkillStatusDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const skill = await this.skillsService.updateStatus(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Skill status updated successfully',
      SkillsMapper.toResponse(skill),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get skill by id' })
  @ApiParam({ name: 'id', description: 'Skill UUID' })
  @ApiStandardResponse(SkillResponseDto, 'Skill fetched successfully')
  async findById(@Param('id') id: string) {
    const skill = await this.skillsService.findById(id);
    return ResponseUtil.success(
      'Skill fetched successfully',
      SkillsMapper.toResponse(skill),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List skills (offset or cursor pagination)' })
  @ApiSkillsPaginatedResponse(SkillResponseDto, 'Skills fetched successfully')
  async list(@Query() query: ListSkillsQueryDto) {
    const result = await this.skillsService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Skills fetched successfully', {
        data: result.data.map(SkillsMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Skills fetched successfully',
      result.data.map(SkillsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete skill' })
  @ApiParam({ name: 'id', description: 'Skill UUID' })
  @ApiStandardResponse(SoftDeleteSkillResponseDto, 'Skill deleted successfully')
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.skillsService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Skill deleted successfully', { id });
  }
}
