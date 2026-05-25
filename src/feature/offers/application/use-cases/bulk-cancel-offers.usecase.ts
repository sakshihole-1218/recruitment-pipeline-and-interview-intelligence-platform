import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { ApplicationStatus } from '../../../applications/enums/application-status.enum';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { ApplicationsValidationHelper } from '../../../applications/helpers/applications-validation.helper';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

import {
  BulkOfferOperationFailureDto,
  BulkOfferOperationResultResponseDto,
} from '../../dto/bulk-offer-operation-result.response.dto';
import { BulkCancelOffersDto } from '../../dto/bulk-cancel-offers.dto';
import { OfferStatus } from '../../enums/offer-status.enum';
import { OffersValidationHelper } from '../../helpers/offers-validation.helper';
import { OfferRepository } from '../../repositories/offer.repository';

@Injectable()
export class BulkCancelOffersUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offerRepository: OfferRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly applicationsValidationHelper: ApplicationsValidationHelper,
    private readonly offersValidationHelper: OffersValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: BulkCancelOffersDto,
    actorUserId?: string,
  ): Promise<BulkOfferOperationResultResponseDto> {
    this.offersValidationHelper.ensureActorUserRequired(actorUserId);

    const successfulIds: string[] = [];
    const failures: BulkOfferOperationFailureDto[] = [];

    for (const offerId of dto.offer_ids) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const now = new Date();

          const offer = await this.offerRepository.findById(offerId, { manager });
          if (!offer) {
            throw new NotFoundException({
              message: 'Offer not found',
              code: 'OFFER_NOT_FOUND',
            });
          }

          this.offersValidationHelper.ensureStatusIn(
            offer,
            [OfferStatus.DRAFT, OfferStatus.SENT],
            'OFFER_CANCEL_NOT_ALLOWED',
          );

          const oldOfferValues = {
            offer_status: offer.offer_status,
          };

          offer.offer_status = OfferStatus.CANCELLED;
          offer.updated_by_user_id = actorUserId ?? null;

          await this.offerRepository.save(offer, { manager });

          const app = await this.applicationRepository.findById(offer.application_id, { manager });
          if (!app) {
            throw new ConflictException({
              message: 'Offer is linked to an invalid application',
              code: 'OFFER_APPLICATION_INVALID',
            });
          }

          this.applicationsValidationHelper.ensureNotTerminalStage(app.current_stage);

          const targetStage = ApplicationCurrentStage.OFFER;
          const fromStage = app.current_stage;
          const reason = dto.cancel_reason ? `Offer cancelled: ${dto.cancel_reason}` : 'Offer cancelled';

          if (fromStage !== targetStage) {
            this.applicationsValidationHelper.ensureStageTransitionAllowed({
              from: fromStage,
              to: targetStage,
            });

            await this.stageHistoryRepository.createAndSave(
              {
                application_id: app.id,
                from_stage: fromStage,
                to_stage: targetStage,
                changed_by_user_id: actorUserId!,
                change_reason: reason,
                changed_at: now,
              },
              { manager },
            );

            app.current_stage = targetStage;
            app.last_stage_changed_at = now;

            await this.activityWriter.log(
              ActivityLogBuilder.stageChange({
                entityType: ActivityEntityType.APPLICATION,
                entityId: app.id,
                fromStage,
                toStage: targetStage,
                reason,
                actorUserId: actorUserId!,
                actionAt: now,
                ipAddress: null,
                userAgent: null,
              }),
              { manager },
            );
          }

          app.application_status = ApplicationStatus.CLOSED;
          app.updated_by_user_id = actorUserId ?? null;
          await this.applicationRepository.save(app, { manager });

          const loaded = await this.offerRepository.findById(offer.id, { manager });
          if (!loaded) {
            throw new ConflictException({
              message: 'We could not complete the request. Please try again',
              code: 'OFFER_POST_CANCEL_LOAD_FAILED',
            });
          }

          await this.activityWriter.log(
            ActivityLogBuilder.build({
              entityType: ActivityEntityType.OFFER,
              entityId: loaded.id,
              actionType: ActivityActionType.STATUS_CHANGE,
              actorUserId: actorUserId!,
              oldValues: oldOfferValues,
              newValues: {
                offer_status: loaded.offer_status,
                cancel_reason: dto.cancel_reason,
              },
              actionAt: now,
              ipAddress: null,
              userAgent: null,
            }),
            { manager },
          );
        });

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
