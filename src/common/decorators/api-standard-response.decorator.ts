import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../dto/base-response.dto';

export function ApiStandardResponse<TModel extends Type<unknown>>(
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
                $ref: getSchemaPath(model),
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