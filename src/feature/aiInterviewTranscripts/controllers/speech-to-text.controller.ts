import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { ApiStandardResponse } from '../../../common/decorators/api-standard-response.decorator';
import { ResponseUtil } from '../../../common/utils/response.util';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { TestSpeechToTextUseCase } from '../application/use-cases/test-speech-to-text.usecase';
import { SpeechToTextTestResponseDto } from '../dto/speech-to-text-test.response.dto';

@ApiTags('Speech To Text')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRoleCode.ADMIN)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('speech-to-text')
export class SpeechToTextController {
  constructor(
    private readonly testSpeechToTextUseCase: TestSpeechToTextUseCase,
  ) {}

  private static getMaxAudioUploadBytes(): number {
    const fallback = 20 * 1024 * 1024;
    const raw = Number(process.env.AI_INTERVIEW_AUDIO_MAX_BYTES);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal endpoint to verify the configured STT provider',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: SpeechToTextController.getMaxAudioUploadBytes(),
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio'],
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiStandardResponse(
    SpeechToTextTestResponseDto,
    'Speech-to-text provider test completed successfully',
  )
  async test(@UploadedFile() file: Express.Multer.File) {
    const result = await this.testSpeechToTextUseCase.execute(file);

    return ResponseUtil.success(
      'Speech-to-text provider test completed successfully',
      result,
    );
  }
}
