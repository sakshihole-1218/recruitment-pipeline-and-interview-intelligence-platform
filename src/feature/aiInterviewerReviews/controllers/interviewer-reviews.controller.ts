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
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { InterviewerReviewsService } from '../application/services/interviewer-reviews.service';
import { ApiInterviewerReviewsArrayResponse } from '../decorators/api-interviewer-reviews-array-response.decorator';
import { ApiInterviewerReviewsPaginatedResponse } from '../decorators/api-interviewer-reviews-paginated-response.decorator';
import { CreateInterviewerReviewDto } from '../dto/create-interviewer-review.dto';
import { DeleteInterviewerReviewResponseDto } from '../dto/delete-interviewer-review.response.dto';
import { InterviewerReviewQueryDto } from '../dto/interviewer-review.query.dto';
import { InterviewerReviewResponseDto } from '../dto/interviewer-review.response.dto';
import { SubmitInterviewerReviewDto } from '../dto/submit-interviewer-review.dto';
import { UpdateInterviewerReviewDto } from '../dto/update-interviewer-review.dto';
import { InterviewerReviewsMapper } from '../helpers/interviewer-reviews.mapper';

@ApiTags('Interviewer Reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
  SystemRoleCode.INTERVIEWER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('interviewer-reviews')
export class InterviewerReviewsController {
  constructor(private readonly service: InterviewerReviewsService) {}

  @Post()
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.INTERVIEWER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create interviewer review draft for an AI interview session',
  })
  @ApiBody({ type: CreateInterviewerReviewDto })
  @ApiStandardResponse(
    InterviewerReviewResponseDto,
    'Interviewer review created successfully',
  )
  async create(
    @Body() dto: CreateInterviewerReviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const review = await this.service.create(dto, actor);
    return ResponseUtil.success(
      'Interviewer review created successfully',
      InterviewerReviewsMapper.toResponse(review),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List interviewer reviews with offset or cursor pagination',
  })
  @ApiInterviewerReviewsPaginatedResponse(
    InterviewerReviewResponseDto,
    'Interviewer reviews fetched successfully',
  )
  async list(
    @Query() query: InterviewerReviewQueryDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const result = await this.service.list(query, actor);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Interviewer reviews fetched successfully', {
        data: result.data.map(InterviewerReviewsMapper.toResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Interviewer reviews fetched successfully',
      result.data.map(InterviewerReviewsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get interviewer reviews by AI interview session id',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiInterviewerReviewsArrayResponse(
    InterviewerReviewResponseDto,
    'Interviewer reviews fetched successfully',
  )
  async getBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const reviews = await this.service.getBySession(sessionId, actor);
    return ResponseUtil.success(
      'Interviewer reviews fetched successfully',
      reviews.map(InterviewerReviewsMapper.toResponse),
    );
  }

  @Get('application/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get interviewer reviews by application id' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiInterviewerReviewsArrayResponse(
    InterviewerReviewResponseDto,
    'Interviewer reviews fetched successfully',
  )
  async getByApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const reviews = await this.service.getByApplication(applicationId, actor);
    return ResponseUtil.success(
      'Interviewer reviews fetched successfully',
      reviews.map(InterviewerReviewsMapper.toResponse),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get interviewer review by id' })
  @ApiParam({ name: 'id', description: 'Interviewer review UUID' })
  @ApiStandardResponse(
    InterviewerReviewResponseDto,
    'Interviewer review fetched successfully',
  )
  async getById(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const review = await this.service.getById(id, actor);
    return ResponseUtil.success(
      'Interviewer review fetched successfully',
      InterviewerReviewsMapper.toResponse(review),
    );
  }

  @Patch(':id')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.INTERVIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update interviewer review draft' })
  @ApiParam({ name: 'id', description: 'Interviewer review UUID' })
  @ApiBody({ type: UpdateInterviewerReviewDto })
  @ApiStandardResponse(
    InterviewerReviewResponseDto,
    'Interviewer review updated successfully',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewerReviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const review = await this.service.update(id, dto, actor);
    return ResponseUtil.success(
      'Interviewer review updated successfully',
      InterviewerReviewsMapper.toResponse(review),
    );
  }

  @Patch(':id/submit')
  @Roles(SystemRoleCode.ADMIN, SystemRoleCode.INTERVIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit interviewer review' })
  @ApiParam({ name: 'id', description: 'Interviewer review UUID' })
  @ApiBody({ type: SubmitInterviewerReviewDto })
  @ApiStandardResponse(
    InterviewerReviewResponseDto,
    'Interviewer review submitted successfully',
  )
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitInterviewerReviewDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const review = await this.service.submit(id, dto, actor);
    return ResponseUtil.success(
      'Interviewer review submitted successfully',
      InterviewerReviewsMapper.toResponse(review),
    );
  }

  @Delete(':id')
  @Roles(SystemRoleCode.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete interviewer review' })
  @ApiParam({ name: 'id', description: 'Interviewer review UUID' })
  @ApiStandardResponse(
    DeleteInterviewerReviewResponseDto,
    'Interviewer review deleted successfully',
  )
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    await this.service.softDelete(id, actor?.sub);
    return ResponseUtil.success('Interviewer review deleted successfully', {
      id,
    });
  }
}
