import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { ApplicationNotesService } from '../application/services/application-notes.service';
import { UpdateApplicationNoteDto } from '../dto/update-application-note.dto';
import { ApplicationNoteResponseDto } from '../dto/application-note.response.dto';
import { SoftDeleteApplicationNoteResponseDto } from '../dto/soft-delete-application-note.response.dto';
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
@Controller('application-notes')
export class ApplicationNotesManagementController {
  constructor(private readonly notesService: ApplicationNotesService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application note by id' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiStandardResponse(ApplicationNoteResponseDto, 'Note fetched successfully')
  async findById(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const note = await this.notesService.findById(id, actor);
    return ResponseUtil.success(
      'Note fetched successfully',
      ApplicationNotesMapper.toResponse(note),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiBody({ type: UpdateApplicationNoteDto })
  @ApiStandardResponse(ApplicationNoteResponseDto, 'Note updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationNoteDto,
    @CurrentUser() actor: AuthJwtPayload,
    @Req() req: Request,
  ) {
    const note = await this.notesService.update({
      id,
      dto,
      actor,
      ipAddress: req.ip,
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    return ResponseUtil.success(
      'Note updated successfully',
      ApplicationNotesMapper.toResponse(note),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete application note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiStandardResponse(SoftDeleteApplicationNoteResponseDto, 'Note deleted successfully')
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
    @Req() req: Request,
  ) {
    await this.notesService.softDelete({
      id,
      actor,
      ipAddress: req.ip,
      userAgent: String(req.headers['user-agent'] ?? ''),
    });

    return ResponseUtil.success('Note deleted successfully', { id });
  }
}
