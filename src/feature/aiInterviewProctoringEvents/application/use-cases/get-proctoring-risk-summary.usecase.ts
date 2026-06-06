import { Injectable } from '@nestjs/common';

import { InterviewProctoringEventsValidationHelper } from '../../helpers/interview-proctoring-events-validation.helper';
import {
  InterviewProctoringEventsMapper,
  ProctoringRiskSummaryModel,
} from '../../helpers/interview-proctoring-events.mapper';
import { InterviewProctoringEventsReferenceRepository } from '../../repositories/interview-proctoring-events-reference.repository';
import { InterviewProctoringEventsRepository } from '../../repositories/interview-proctoring-events.repository';
import { ProctoringSeverity } from '../../enums/proctoring-severity.enum';
import { RiskLevel } from '../../enums/risk-level.enum';

const SEVERITY_POINTS: Record<ProctoringSeverity, number> = {
  [ProctoringSeverity.LOW]: 5,
  [ProctoringSeverity.MEDIUM]: 15,
  [ProctoringSeverity.HIGH]: 30,
  [ProctoringSeverity.CRITICAL]: 50,
};

@Injectable()
export class GetProctoringRiskSummaryUseCase {
  constructor(
    private readonly repository: InterviewProctoringEventsRepository,
    private readonly referenceRepository: InterviewProctoringEventsReferenceRepository,
    private readonly validation: InterviewProctoringEventsValidationHelper,
  ) {}

  async execute(sessionId: string): Promise<ProctoringRiskSummaryModel> {
    const session = await this.referenceRepository.findSessionById(sessionId);
    this.validation.ensureSessionExists(sessionId, Boolean(session));

    const events = await this.repository.getEventsForRiskSummary(sessionId);

    const lowCount = events.filter((event) => event.severity === ProctoringSeverity.LOW).length;
    const mediumCount = events.filter((event) => event.severity === ProctoringSeverity.MEDIUM).length;
    const highCount = events.filter((event) => event.severity === ProctoringSeverity.HIGH).length;
    const criticalCount = events.filter((event) => event.severity === ProctoringSeverity.CRITICAL).length;
    const riskScore = events.reduce(
      (total, event) => total + SEVERITY_POINTS[event.severity],
      0,
    );

    const riskLevel = this.getRiskLevel(riskScore);
    const summary = this.buildSummary({
      totalEvents: events.length,
      lowCount,
      mediumCount,
      highCount,
      criticalCount,
      riskScore,
      riskLevel,
    });

    return InterviewProctoringEventsMapper.toRiskSummaryResponse({
      ai_interview_session_id: sessionId,
      total_events: events.length,
      low_count: lowCount,
      medium_count: mediumCount,
      high_count: highCount,
      critical_count: criticalCount,
      risk_score: riskScore,
      risk_level: riskLevel,
      summary,
    });
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score <= 20) {
      return RiskLevel.LOW;
    }

    if (score <= 50) {
      return RiskLevel.MEDIUM;
    }

    if (score <= 90) {
      return RiskLevel.HIGH;
    }

    return RiskLevel.CRITICAL;
  }

  private buildSummary(options: {
    totalEvents: number;
    lowCount: number;
    mediumCount: number;
    highCount: number;
    criticalCount: number;
    riskScore: number;
    riskLevel: RiskLevel;
  }): string {
    if (!options.totalEvents) {
      return 'No proctoring events recorded for this AI interview session.';
    }

    return `Recorded ${options.totalEvents} proctoring event(s): ${options.lowCount} low, ${options.mediumCount} medium, ${options.highCount} high, ${options.criticalCount} critical. Overall risk score is ${options.riskScore}, classified as ${options.riskLevel}.`;
  }
}
