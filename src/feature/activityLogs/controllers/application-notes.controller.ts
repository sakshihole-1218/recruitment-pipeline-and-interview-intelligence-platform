import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
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
import type { Request } from 'express';

import { ResponseUtil } from '../../../common/utils/response.util';
import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { ApplicationNotesService } from '../application/services/application-notes.service';
import { CreateApplicationNoteDto } from '../dto/create-application-note.dto';
import { ListApplicationNotesQueryDto } from '../dto/list-application-notes.query.dto';
import { ApplicationNoteResponseDto } from '../dto/application-note.response.dto';
import { ApiApplicationNotesPaginatedResponse } from '../decorators/api-application-notes-paginated-response.decorator';
import { ApplicationNotesMapper } from '../helpers/application-notes.mapper';

@ApiTags('Application Notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('applications/:applicationId/notes')
export class ApplicationNotesController {
  constructor(private readonly notesService: ApplicationNotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create application note' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiBody({ type: CreateApplicationNoteDto })
  @ApiStandardResponse(ApplicationNoteResponseDto, 'Note created successfully')
  async create(
    @Param('applicationId') applicationId: string,
    @Body() dto: CreateApplicationNoteDto,
    @CurrentUser() actor: AuthJwtPayload,
    @Req() req: Request,
  ) {
    const note = await this.notesService.create({
      applicationId,
      dto,
      actor,
      ipAddress: req.ip,
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    return ResponseUtil.success(
      'Note created successfully',
      ApplicationNotesMapper.toResponse(note),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List application notes by application (offset or cursor pagination)' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiApplicationNotesPaginatedResponse(
    ApplicationNoteResponseDto,
    'Notes fetched successfully',
  )
  async list(
    @Param('applicationId') applicationId: string,
    @Query() query: ListApplicationNotesQueryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.notesService.listByApplication({
      applicationId,
      query,
      actor,
    });

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Notes fetched successfully', {
        data: result.data.map(ApplicationNotesMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Notes fetched successfully',
      result.data.map(ApplicationNotesMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }
}
