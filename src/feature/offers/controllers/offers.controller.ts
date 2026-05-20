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

import { OffersService } from '../application/services/offers.service';
import { ApiOffersPaginatedResponse } from '../decorators/api-offers-paginated-response.decorator';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { DeclineOfferDto } from '../dto/decline-offer.dto';
import { ListOffersQueryDto } from '../dto/list-offers.query.dto';
import { OfferResponseDto } from '../dto/offer.response.dto';
import { SoftDeleteOfferResponseDto } from '../dto/soft-delete-offer.response.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { OffersMapper } from '../helpers/offers.mapper';

@ApiTags('Offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN, SystemRoleCode.RECRUITER, SystemRoleCode.HIRING_MANAGER)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create offer (DRAFT)' })
  @ApiBody({ type: CreateOfferDto })
  @ApiStandardResponse(OfferResponseDto, 'Offer created successfully')
  async create(@Body() dto: CreateOfferDto, @CurrentUser() actor: AuthJwtPayload) {
    const offer = await this.offersService.create(dto, actor?.sub);
    return ResponseUtil.success('Offer created successfully', OffersMapper.toOfferResponse(offer));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update offer (only when DRAFT)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiBody({ type: UpdateOfferDto })
  @ApiStandardResponse(OfferResponseDto, 'Offer updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const offer = await this.offersService.update(id, dto, actor?.sub);
    return ResponseUtil.success('Offer updated successfully', OffersMapper.toOfferResponse(offer));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get offer by id' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer fetched successfully')
  async findById(@Param('id') id: string) {
    const offer = await this.offersService.findById(id);
    return ResponseUtil.success('Offer fetched successfully', OffersMapper.toOfferResponse(offer));
  }

  @Get('by-application/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest offer by application id' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer fetched successfully')
  async findByApplicationId(@Param('applicationId') applicationId: string) {
    const offer = await this.offersService.findByApplicationId(applicationId);
    return ResponseUtil.success('Offer fetched successfully', OffersMapper.toOfferResponse(offer));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List offers (offset or cursor pagination)' })
  @ApiOffersPaginatedResponse(OfferResponseDto, 'Offers fetched successfully')
  async list(@Query() query: ListOffersQueryDto) {
    const result = await this.offersService.list(query);

    if (result.mode === 'cursor') {
      return ResponseUtil.success('Offers fetched successfully', {
        data: result.data.map(OffersMapper.toOfferResponse),
        limit: result.limit,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    return ResponseUtil.paginated(
      'Offers fetched successfully',
      result.data.map(OffersMapper.toOfferResponse),
      result.page,
      result.limit,
      result.total_records,
    );
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send offer (DRAFT -> SENT)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer sent successfully')
  async send(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const offer = await this.offersService.send(id, actor?.sub);
    return ResponseUtil.success('Offer sent successfully', OffersMapper.toOfferResponse(offer));
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept offer (SENT -> ACCEPTED)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer accepted successfully')
  async accept(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const offer = await this.offersService.accept(id, actor?.sub);
    return ResponseUtil.success('Offer accepted successfully', OffersMapper.toOfferResponse(offer));
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline offer (SENT -> DECLINED)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiBody({ type: DeclineOfferDto })
  @ApiStandardResponse(OfferResponseDto, 'Offer declined successfully')
  async decline(
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
    @CurrentUser() actor: AuthJwtPayload,
  ) {
    const offer = await this.offersService.decline(id, dto, actor?.sub);
    return ResponseUtil.success('Offer declined successfully', OffersMapper.toOfferResponse(offer));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel offer (DRAFT/SENT -> CANCELLED)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer cancelled successfully')
  async cancel(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const offer = await this.offersService.cancel(id, actor?.sub);
    return ResponseUtil.success('Offer cancelled successfully', OffersMapper.toOfferResponse(offer));
  }

  @Post(':id/expire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expire offer (SENT -> EXPIRED)' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(OfferResponseDto, 'Offer expired successfully')
  async expire(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    const offer = await this.offersService.expire(id, actor?.sub);
    return ResponseUtil.success('Offer expired successfully', OffersMapper.toOfferResponse(offer));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete offer' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiStandardResponse(SoftDeleteOfferResponseDto, 'Offer deleted successfully')
  async softDelete(@Param('id') id: string, @CurrentUser() actor: AuthJwtPayload) {
    await this.offersService.softDelete(id, actor?.sub);
    return ResponseUtil.success('Offer deleted successfully', { id });
  }
}
