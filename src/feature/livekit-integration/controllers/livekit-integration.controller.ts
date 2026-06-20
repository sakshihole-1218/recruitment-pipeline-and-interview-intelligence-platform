import {
  Body,
  Controller,
  Get,
  Headers,
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
import { Request } from 'express';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';

import { LivekitIntegrationService } from '../application/services/livekit-integration.service';
import { ApiLivekitRoomsPaginatedResponse } from '../decorators/api-livekit-rooms-paginated-response.decorator';
import { CreateLiveKitRoomDto } from '../dto/create-livekit-room.dto';
import { EndLiveKitRoomDto } from '../dto/end-livekit-room.dto';
import { GenerateLiveKitTokenDto } from '../dto/generate-livekit-token.dto';
import { LiveKitRoomQueryDto } from '../dto/livekit-room-query.dto';
import { LivekitAccessTokenResponseDto } from '../dto/livekit-access-token.response.dto';
import { LivekitRoomSessionResponseDto } from '../dto/livekit-room-session.response.dto';
import { LivekitWebhookResponseDto } from '../dto/livekit-webhook-response.dto';
import { LivekitRoomSessionsMapper } from '../helpers/livekit-room-sessions.mapper';

@ApiTags('LiveKit Integration')
@Controller('livekit')
export class LivekitIntegrationController {
  constructor(private readonly service: LivekitIntegrationService) {}

  @Post('rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or fetch a LiveKit room for an AI interview session',
  })
  @ApiBody({ type: CreateLiveKitRoomDto })
  @ApiStandardResponse(
    LivekitRoomSessionResponseDto,
    'LiveKit room created successfully',
  )
  async createRoom(
    @Body() dto: CreateLiveKitRoomDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const room = await this.service.createRoom(dto, actor?.sub);
    return ResponseUtil.success(
      'LiveKit room created successfully',
      LivekitRoomSessionsMapper.toResponse(room),
    );
  }

  @Post('token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate LiveKit participant token' })
  @ApiBody({ type: GenerateLiveKitTokenDto })
  @ApiStandardResponse(
    LivekitAccessTokenResponseDto,
    'LiveKit token generated successfully',
  )
  async generateToken(
    @Body() dto: GenerateLiveKitTokenDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const token = await this.service.generateToken(dto, actor?.sub);
    return ResponseUtil.success('LiveKit token generated successfully', token);
  }

  @Post('rooms/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a LiveKit room for an AI interview session' })
  @ApiBody({ type: EndLiveKitRoomDto })
  @ApiStandardResponse(
    LivekitRoomSessionResponseDto,
    'LiveKit room ended successfully',
  )
  async endRoom(
    @Body() dto: EndLiveKitRoomDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const room = await this.service.endRoom(dto, actor?.sub);
    return ResponseUtil.success(
      'LiveKit room ended successfully',
      LivekitRoomSessionsMapper.toResponse(room),
    );
  }

  @Get('rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List LiveKit room sessions' })
  @ApiLivekitRoomsPaginatedResponse(
    LivekitRoomSessionResponseDto,
    'LiveKit room sessions fetched successfully',
  )
  async list(@Query() query: LiveKitRoomQueryDto) {
    const result = await this.service.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success(
        'LiveKit room sessions fetched successfully',
        {
          data: result.data.map(LivekitRoomSessionsMapper.toResponse),
          limit: result.limit,
          next_cursor: result.next_cursor,
          has_more: result.has_more,
        },
      );
    }

    return ResponseUtil.paginated(
      'LiveKit room sessions fetched successfully',
      result.data.map(LivekitRoomSessionsMapper.toResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Get('rooms/session/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get LiveKit room session by AI interview session id',
  })
  @ApiParam({ name: 'sessionId', description: 'AI interview session UUID' })
  @ApiStandardResponse(
    LivekitRoomSessionResponseDto,
    'LiveKit room session fetched successfully',
  )
  async getBySession(@Param('sessionId') sessionId: string) {
    const room = await this.service.getBySession(sessionId);
    return ResponseUtil.success(
      'LiveKit room session fetched successfully',
      LivekitRoomSessionsMapper.toResponse(room),
    );
  }

  @Get('rooms/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    SystemRoleCode.ADMIN,
    SystemRoleCode.RECRUITER,
    SystemRoleCode.HIRING_MANAGER,
    SystemRoleCode.INTERVIEWER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get LiveKit room session by id' })
  @ApiParam({ name: 'id', description: 'LiveKit room session UUID' })
  @ApiStandardResponse(
    LivekitRoomSessionResponseDto,
    'LiveKit room session fetched successfully',
  )
  async getById(@Param('id') id: string) {
    const room = await this.service.getById(id);
    return ResponseUtil.success(
      'LiveKit room session fetched successfully',
      LivekitRoomSessionsMapper.toResponse(room),
    );
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle LiveKit webhook events' })
  @ApiStandardResponse(
    LivekitWebhookResponseDto,
    'LiveKit webhook processed successfully',
  )
  async handleWebhook(
    @Req() req: Request & { rawBody?: string },
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    const result = await this.service.handleWebhook({
      rawBody: req.rawBody || JSON.stringify(body || {}),
      authorizationHeader,
    });

    return ResponseUtil.success(
      'LiveKit webhook processed successfully',
      result,
    );
  }
}
