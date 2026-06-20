import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AiInsightsGeminiService } from '../application/services/ai-insights-gemini.service';
import { GeminiTestResponseDto } from '../dto/gemini-test.response.dto';

@ApiTags('AI Insights - Gemini')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemRoleCode.ADMIN,
  SystemRoleCode.RECRUITER,
  SystemRoleCode.HIRING_MANAGER,
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('ai-insights/gemini')
export class AiInsightsGeminiController {
  constructor(private readonly geminiService: AiInsightsGeminiService) {}

  @Get('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Gemini API connectivity' })
  @ApiStandardResponse(
    GeminiTestResponseDto,
    'Gemini test completed successfully',
  )
  async testConnection() {
    const result = await this.geminiService.testConnection();
    return ResponseUtil.success('Gemini test completed successfully', result);
  }
}
