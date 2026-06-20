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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import * as fs from 'fs';
import { join } from 'path';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ResponseUtil } from '../../../common/utils/response.util';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { CandidatesService } from '../application/services/candidates.service';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { UpdateCandidateDto } from '../dto/update-candidate.dto';
import { CandidateResponseDto } from '../dto/candidate.response.dto';
import { SoftDeleteCandidateResponseDto } from '../dto/soft-delete-candidate.response.dto';
import { BulkCreateCandidatesDto } from '../dto/bulk-create-candidates.dto';
import { BulkUpdateCandidateStatusDto } from '../dto/bulk-update-candidate-status.dto';
import { BulkAddSkillsDto } from '../dto/bulk-add-skills.dto';
import { BulkCreateCandidatesResponseDto } from '../dto/bulk-create-candidates.response.dto';
import { BulkUpdateCandidateStatusResponseDto } from '../dto/bulk-update-candidate-status.response.dto';
import { BulkAddSkillsResponseDto } from '../dto/bulk-add-skills.response.dto';
import { ListCandidatesQueryDto } from '../dto/list-candidates.query.dto';
import { ApiCandidatesPaginatedResponse } from '../decorators/api-candidates-paginated-response.decorator';
import { CandidatesMapper } from '../helpers/candidates.mapper';
import { UpsertCandidateSkillsDto } from '../dto/upsert-candidate-skills.dto';
import { CandidateSkillResponseDto } from '../dto/candidate-skill.response.dto';
import { CandidateDocumentResponseDto } from '../dto/candidate-document.response.dto';
import { RemoveCandidateSkillResponseDto } from '../dto/remove-candidate-skill.response.dto';
import { UploadCandidateDocumentDto } from '../dto/upload-candidate-document.dto';

@ApiTags('Candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  private static getMaxUploadBytes(): number {
    const fallback = 25 * 1024 * 1024; // 25MB
    const raw = Number(process.env.CANDIDATE_DOCUMENT_MAX_BYTES);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  private static sanitizeFilename(name: string): string {
    return String(name ?? '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 180);
  }

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create candidate profile' })
  @ApiBody({ type: CreateCandidateDto })
  @ApiStandardResponse(CandidateResponseDto, 'Candidate created successfully')
  async create(
    @Body() dto: CreateCandidateDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const candidate = await this.candidatesService.create(dto, actor?.sub);
    return ResponseUtil.success(
      'Candidate created successfully',
      CandidatesMapper.toCandidateResponse(candidate),
    );
  }

  @Post('bulk/create')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk create candidate profiles (partial success)' })
  @ApiBody({ type: BulkCreateCandidatesDto })
  @ApiStandardResponse(
    BulkCreateCandidatesResponseDto,
    'Bulk create processed (partial success)',
  )
  async bulkCreate(
    @Body() dto: BulkCreateCandidatesDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.candidatesService.bulkCreate(dto, actor?.sub);

    return ResponseUtil.success('Bulk create processed', {
      created: result.created.map(CandidatesMapper.toCandidateResponse),
      failed: result.failed,
      summary: {
        total: Array.isArray(dto.candidates) ? dto.candidates.length : 0,
        success_count: result.created.length,
        failed_count: result.failed.length,
      },
    });
  }

  @Post('bulk/update-status')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update candidate active status (partial success)',
  })
  @ApiBody({ type: BulkUpdateCandidateStatusDto })
  @ApiStandardResponse(
    BulkUpdateCandidateStatusResponseDto,
    'Bulk status update processed (partial success)',
  )
  async bulkUpdateStatus(
    @Body() dto: BulkUpdateCandidateStatusDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.candidatesService.bulkUpdateStatus(
      dto,
      actor?.sub,
    );

    return ResponseUtil.success('Bulk status update processed', {
      updated: result.updated,
      failed: result.failed,
      summary: {
        total: Array.isArray(dto.candidate_ids) ? dto.candidate_ids.length : 0,
        success_count: result.updated.length,
        failed_count: result.failed.length,
      },
    });
  }

  @Post('bulk/add-skills')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk add skills to candidates (partial success)' })
  @ApiBody({ type: BulkAddSkillsDto })
  @ApiStandardResponse(
    BulkAddSkillsResponseDto,
    'Bulk skill add processed (partial success)',
  )
  async bulkAddSkills(
    @Body() dto: BulkAddSkillsDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.candidatesService.bulkAddSkills(dto, actor?.sub);

    return ResponseUtil.success('Bulk skill add processed', {
      invalid_skill_ids: result.invalid_skill_ids,
      results: result.results,
      failed: result.failed,
      summary: {
        total: Array.isArray(dto.candidate_ids) ? dto.candidate_ids.length : 0,
        success_count: result.results.length,
        failed_count: result.failed.length,
      },
    });
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update candidate profile' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiBody({ type: UpdateCandidateDto })
  @ApiStandardResponse(CandidateResponseDto, 'Candidate updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const candidate = await this.candidatesService.update(id, dto, actor?.sub);
    return ResponseUtil.success(
      'Candidate updated successfully',
      CandidatesMapper.toCandidateResponse(candidate),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get candidate by id' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiStandardResponse(CandidateResponseDto, 'Candidate fetched successfully')
  async findById(@Param('id') id: string) {
    const candidate = await this.candidatesService.findById(id);
    return ResponseUtil.success(
      'Candidate fetched successfully',
      CandidatesMapper.toCandidateResponse(candidate),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List candidates (offset or cursor pagination)' })
  @ApiCandidatesPaginatedResponse(
    CandidateResponseDto,
    'Candidates fetched successfully',
  )
  async list(@Query() query: ListCandidatesQueryDto) {
    const result = await this.candidatesService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Candidates fetched successfully', {
        data: result.data.map(CandidatesMapper.toCandidateResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Candidates fetched successfully',
      result.data.map(CandidatesMapper.toCandidateResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete candidate' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiStandardResponse(
    SoftDeleteCandidateResponseDto,
    'Candidate deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.candidatesService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Candidate deleted successfully', { id });
  }

  @Put(':id/skills')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add/update candidate skills' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiBody({ type: UpsertCandidateSkillsDto })
  @ApiExtraModels(BaseResponseDto, CandidateSkillResponseDto)
  @ApiOkResponse({
    description: 'Candidate skills updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CandidateSkillResponseDto) },
            },
          },
        },
      ],
    },
  })
  async upsertSkills(
    @Param('id') id: string,
    @Body() dto: UpsertCandidateSkillsDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const skills = await this.candidatesService.upsertSkills(
      id,
      dto,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Candidate skills updated successfully',
      skills.map(CandidatesMapper.toSkillResponse),
    );
  }

  @Get(':id/skills')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get candidate skills' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiExtraModels(BaseResponseDto, CandidateSkillResponseDto)
  @ApiOkResponse({
    description: 'Candidate skills fetched successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CandidateSkillResponseDto) },
            },
          },
        },
      ],
    },
  })
  async listSkills(@Param('id') id: string) {
    const skills = await this.candidatesService.listSkills(id);
    return ResponseUtil.success(
      'Candidate skills fetched successfully',
      skills.map(CandidatesMapper.toSkillResponse),
    );
  }

  @Delete(':id/skills/:skillId')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove candidate skill' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiParam({ name: 'skillId', description: 'Skill UUID' })
  @ApiStandardResponse(
    RemoveCandidateSkillResponseDto,
    'Candidate skill removed successfully',
  )
  async removeSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.candidatesService.removeSkill(id, skillId, actor?.sub);
    return ResponseUtil.success('Candidate skill removed successfully', {
      candidate_id: id,
      skill_id: skillId,
    });
  }

  @Post(':id/documents/upload')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload candidate document (stores file + metadata)',
  })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const candidateId = String((req as any)?.params?.id ?? 'unknown');
          const dest = join(
            process.cwd(),
            'uploads',
            'candidates',
            candidateId,
          );
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const safe = CandidatesController.sanitizeFilename(file.originalname);
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}-${safe}`);
        },
      }),
      limits: { fileSize: CandidatesController.getMaxUploadBytes() },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document_type', 'file'],
      properties: {
        document_type: {
          type: 'string',
          enum: [
            'RESUME',
            'COVER_LETTER',
            'PORTFOLIO',
            'CERTIFICATION',
            'ID_PROOF',
            'OTHER',
          ],
          example: 'RESUME',
        },
        is_latest: {
          type: 'boolean',
          example: true,
          description: 'Only applicable for RESUME documents',
        },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiStandardResponse(
    CandidateDocumentResponseDto,
    'Candidate document uploaded successfully',
  )
  async uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadCandidateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const doc = await this.candidatesService.uploadDocument(
      id,
      dto,
      file
        ? {
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
          }
        : undefined,
      actor?.sub,
    );

    return ResponseUtil.success(
      'Candidate document uploaded successfully',
      CandidatesMapper.toDocumentResponse(doc),
    );
  }

  @Get(':id/documents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get candidate documents' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiExtraModels(BaseResponseDto, CandidateDocumentResponseDto)
  @ApiOkResponse({
    description: 'Candidate documents fetched successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CandidateDocumentResponseDto) },
            },
          },
        },
      ],
    },
  })
  async listDocuments(@Param('id') id: string) {
    const docs = await this.candidatesService.listDocuments(id);
    return ResponseUtil.success(
      'Candidate documents fetched successfully',
      docs.map(CandidatesMapper.toDocumentResponse),
    );
  }

  @Patch(':id/documents/:documentId/latest')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark candidate resume as latest' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiParam({ name: 'documentId', description: 'Candidate document UUID' })
  @ApiStandardResponse(
    CandidateDocumentResponseDto,
    'Candidate resume marked as latest successfully',
  )
  async markLatestResume(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const doc = await this.candidatesService.markLatestResume(
      id,
      documentId,
      actor?.sub,
    );
    return ResponseUtil.success(
      'Candidate resume marked as latest successfully',
      CandidatesMapper.toDocumentResponse(doc),
    );
  }
}
