import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { UserRepository } from '../../../accessControl/repositories/user.repository';
import { ApplicationRepository } from '../../../applications/repositories/application.repository';
import { ApplicationStageHistoryRepository } from '../../../applications/repositories/application-stage-history.repository';
import { ApplicationCurrentStage } from '../../../applications/enums/application-current-stage.enum';
import { CreateApplicationDecisionDto } from '../../dto/create-application-decision.dto';
import { ApplicationDecisionEntity } from '../../entities/application-decision.entity';
import { ApplicationDecisionRepository } from '../../repositories/application-decision.repository';
import { DecisionsValidationHelper } from '../../helpers/decisions-validation.helper';
import { DecisionsApplicationStageHelper } from '../../helpers/decisions-application-stage.helper';
import { InterviewEntity } from '../../../interviews/entities/interview.entity';
import { InterviewRoundEntity } from '../../../interviews/entities/interview-round.entity';
import { InterviewStatus } from '../../../interviews/enums/interview-status.enum';
import { ActivityLogsWriterService } from '../../../activityLogs/application/services/activity-logs-writer.service';
import { ActivityActionType } from '../../../activityLogs/enums/activity-action-type.enum';
import { ActivityEntityType } from '../../../activityLogs/enums/activity-entity-type.enum';
import { ActivityLogBuilder } from '../../../activityLogs/helpers/activity-log.builder';

@Injectable()
export class CreateApplicationDecisionUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly decisionRepository: ApplicationDecisionRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly stageHistoryRepository: ApplicationStageHistoryRepository,
    private readonly userRepository: UserRepository,
    private readonly validationHelper: DecisionsValidationHelper,
    private readonly activityWriter: ActivityLogsWriterService,
  ) {}

  async execute(
    dto: CreateApplicationDecisionDto,
    actorUserId: string,
  ): Promise<ApplicationDecisionEntity> {
    if (!actorUserId) {
      throw new BadRequestException({
        message: 'Actor user is required',
        code: 'ACTOR_USER_REQUIRED',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const application = await this.applicationRepository.findById(
        dto.application_id,
        { manager },
      );

      if (!application) {
        throw new NotFoundException({
          message: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      const eligibleStages = [
        ApplicationCurrentStage.INTERVIEW,
        ApplicationCurrentStage.DECISION,
      ];

      if (!eligibleStages.includes(application.current_stage)) {
        throw new ConflictException({
          message:
            'Decision can only be created when application is in INTERVIEW or DECISION stage',
          code: 'APPLICATION_NOT_ELIGIBLE_FOR_DECISION',
          meta: { current_stage: application.current_stage },
        });
      }

      const actor = await this.userRepository.findById(actorUserId, { manager });
      if (!actor) {
        throw new NotFoundException({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const existing = await this.decisionRepository.findByApplicationId(
        application.id,
        { manager },
      );

      if (existing) {
        throw new ConflictException({
          message: 'A final decision already exists for this application',
          code: 'DECISION_ALREADY_EXISTS_FOR_APPLICATION',
        });
      }

      const decisionReason = this.validationHelper.normalizeReason(
        dto.decision_reason,
      );
      this.validationHelper.ensureReasonRules({
        decision_status: dto.decision_status,
        decision_reason: decisionReason,
      });

      await this.ensureMandatoryRoundsCompleted({
        applicationId: application.id,
        jobOpeningId: application.job_opening_id,
        manager,
      });

      const now = new Date();

      let created: ApplicationDecisionEntity;
      try {
        created = await this.decisionRepository.createAndSave(
          {
            application_id: application.id,
            decision_status: dto.decision_status,
            decision_reason: decisionReason,
            decided_by_user_id: actor.id,
            decision_at: now,
            created_by_user_id: actor.id,
            updated_by_user_id: null,
            deleted_by_user_id: null,
            deleted_at: null,
          },
          { manager },
        );
      } catch (error: any) {
        if (String(error?.code) === '23505') {
          throw new ConflictException({
            message: 'A final decision already exists for this application',
            code: 'DECISION_ALREADY_EXISTS_FOR_APPLICATION',
          });
        }
        throw error;
      }

      const mapped = DecisionsApplicationStageHelper.mapDecisionToApplicationState(
        {
          decision_status: created.decision_status,
          decision_reason: created.decision_reason,
        },
      );

      const stageChanges: Array<{
        from: ApplicationCurrentStage;
        to: ApplicationCurrentStage;
        reason: string | null;
      }> = [];

      if (application.current_stage === ApplicationCurrentStage.INTERVIEW) {
        await this.stageHistoryRepository.createAndSave(
          {
            application_id: application.id,
            from_stage: ApplicationCurrentStage.INTERVIEW,
            to_stage: ApplicationCurrentStage.DECISION,
            changed_by_user_id: actor.id,
            change_reason: null,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        stageChanges.push({
          from: ApplicationCurrentStage.INTERVIEW,
          to: ApplicationCurrentStage.DECISION,
          reason: null,
        });

        application.current_stage = ApplicationCurrentStage.DECISION;
        application.last_stage_changed_at = now;
      }

      const fromStage = application.current_stage;
      const toStage = mapped.current_stage;

      if (fromStage !== toStage) {
        await this.stageHistoryRepository.createAndSave(
          {
            application_id: application.id,
            from_stage: fromStage,
            to_stage: toStage,
            changed_by_user_id: actor.id,
            change_reason: created.decision_reason,
            changed_at: now,
            deleted_at: null,
          },
          { manager },
        );

        stageChanges.push({ from: fromStage, to: toStage, reason: created.decision_reason });

        application.current_stage = toStage;
        application.last_stage_changed_at = now;
      }

      application.application_status = mapped.application_status;
      application.rejection_reason = mapped.rejection_reason;
      application.withdrawal_reason = null;

      application.updated_by_user_id = actor.id;
      await this.applicationRepository.save(application, { manager });

      const loaded = await this.decisionRepository.findById(created.id, {
        manager,
      });
      if (!loaded) {
        throw new ConflictException({
          message: 'We could not complete the request. Please try again',
          code: 'DECISION_POST_CREATE_LOAD_FAILED',
        });
      }

      for (const sc of stageChanges) {
        await this.activityWriter.log(
          ActivityLogBuilder.stageChange({
            entityType: ActivityEntityType.APPLICATION,
            entityId: application.id,
            fromStage: sc.from,
            toStage: sc.to,
            reason: sc.reason,
            actorUserId: actor.id,
            actionAt: now,
            ipAddress: null,
            userAgent: null,
          }),
          { manager },
        );
      }

      await this.activityWriter.log(
        ActivityLogBuilder.build({
          entityType: ActivityEntityType.DECISION,
          entityId: loaded.id,
          actionType: ActivityActionType.CREATE,
          actorUserId: actor.id,
          oldValues: null,
          newValues: {
            application_id: loaded.application_id,
            decision_status: loaded.decision_status,
          },
          actionAt: now,
          ipAddress: null,
          userAgent: null,
        }),
        { manager },
      );

      return loaded;
    });
  }

  private async ensureMandatoryRoundsCompleted(options: {
    applicationId: string;
    jobOpeningId: string;
    manager: EntityManager;
  }): Promise<void> {
    const rounds = await options.manager
      .getRepository(InterviewRoundEntity)
      .createQueryBuilder('rounds')
      .where('rounds.job_opening_id = :jobOpeningId', {
        jobOpeningId: options.jobOpeningId,
      })
      .andWhere('rounds.is_mandatory = true')
      .andWhere('rounds.deleted_at IS NULL')
      .getMany();

    if (!rounds.length) return;

    const completedRows = await options.manager
      .getRepository(InterviewEntity)
      .createQueryBuilder('interviews')
      .select('DISTINCT interviews.interview_round_id', 'interview_round_id')
      .where('interviews.application_id = :applicationId', {
        applicationId: options.applicationId,
      })
      .andWhere('interviews.interview_status = :status', {
        status: InterviewStatus.COMPLETED,
      })
      .andWhere('interviews.deleted_at IS NULL')
      .getRawMany<{ interview_round_id: string }>();

    const completed = new Set(completedRows.map((r) => r.interview_round_id));
    const missing = rounds
      .filter((r) => !completed.has(r.id))
      .map((r) => ({
        id: r.id,
        round_name: r.round_name,
        sequence_number: r.sequence_number,
      }));

    if (missing.length) {
      throw new ConflictException({
        message: 'Mandatory interview rounds are not completed',
        code: 'DECISION_MANDATORY_ROUNDS_INCOMPLETE',
        meta: { missing_rounds: missing },
      });
    }
  }
}
