import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export function ApiInterviewFeedbackPaginatedResponse<
  TModel extends Type<unknown>,
>(model: TModel, description = 'Records fetched successfully') {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, PaginatedResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        oneOf: [
          {
            allOf: [
              { $ref: getSchemaPath(PaginatedResponseDto) },
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
          {
            allOf: [
              { $ref: getSchemaPath(BaseResponseDto) },
              {
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                      limit: { type: 'number', example: 10 },
                      next_cursor: {
                        type: 'string',
                        nullable: true,
                        example: '2026-01-15T10:30:00.000Z',
                      },
                      has_more: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    }),
    ApiBadRequestResponse({ description: 'Bad request' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}
