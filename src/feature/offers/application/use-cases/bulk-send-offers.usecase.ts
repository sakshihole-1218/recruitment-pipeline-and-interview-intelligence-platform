import { HttpException, Injectable } from '@nestjs/common';

import {
  BulkOfferOperationFailureDto,
  BulkOfferOperationResultResponseDto,
} from '../../dto/bulk-offer-operation-result.response.dto';
import { BulkOfferIdsDto } from '../../dto/bulk-offer-ids.dto';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { SendOfferUseCase } from './send-offer.usecase';

@Injectable()
export class BulkSendOffersUseCase {
  constructor(
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly sendOfferUseCase: SendOfferUseCase,
  ) {}

  async execute(
    dto: BulkOfferIdsDto,
    actorUserId?: string,
  ): Promise<BulkOfferOperationResultResponseDto> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    const successfulIds: string[] = [];
    const failures: BulkOfferOperationFailureDto[] = [];

    for (const offerId of dto.offer_ids) {
      try {
        await this.sendOfferUseCase.execute(offerId, actorUserId);
        successfulIds.push(offerId);
      } catch (error) {
        failures.push({
          offer_id: offerId,
          reason: this.extractErrorReason(error),
        });
      }
    }

    return {
      success_count: successfulIds.length,
      failed_count: failures.length,
      successful_ids: successfulIds,
      failures,
    };
  }

  private extractErrorReason(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const message = (response as any).message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message) && message.length) return String(message[0]);
      }
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }

    return 'Unable to process record';
  }
}
