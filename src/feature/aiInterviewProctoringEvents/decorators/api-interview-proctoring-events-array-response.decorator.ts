import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export function ApiInterviewProctoringEventsArrayResponse<TModel extends Type<unknown>>(
  model: TModel,
  description = 'Request processed successfully',
) {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
    ApiBadRequestResponse({ description: 'Bad request' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}
