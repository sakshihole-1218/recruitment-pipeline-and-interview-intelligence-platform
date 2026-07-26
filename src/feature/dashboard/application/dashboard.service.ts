import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { OfferEntity } from '../../offers/entities/offer.entity';
import { ActivityLogEntity } from '../../activityLogs/entities/activity-log.entity';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';
import { InterviewStatus } from '../../interviews/enums/interview-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(JobOpeningEntity)
    private readonly jobOpeningRepository: Repository<JobOpeningEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: Repository<CandidateEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(InterviewEntity)
    private readonly interviewRepository: Repository<InterviewEntity>,
    @InjectRepository(OfferEntity)
    private readonly offerRepository: Repository<OfferEntity>,
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepository: Repository<ActivityLogEntity>,
  ) {}

  async getStats(user: AuthJwtPayload) {
    // Basic global count for now.
    const jobOpenings = await this.jobOpeningRepository.count();
    const candidates = await this.candidateRepository.count();
    const applications = await this.applicationRepository.count();

    const roles = user?.roles ?? [];
    const isInterviewerOnly =
      roles.includes(SystemRoleCode.INTERVIEWER) &&
      !roles.includes(SystemRoleCode.ADMIN) &&
      !roles.includes(SystemRoleCode.RECRUITER) &&
      !roles.includes(SystemRoleCode.HIRING_MANAGER);

    let interviewsQuery = this.interviewRepository
      .createQueryBuilder('interview')
      .where('interview.interview_status IN (:...statuses)', {
        statuses: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
      });

    if (isInterviewerOnly && user?.sub) {
      interviewsQuery = interviewsQuery
        .innerJoin('interview.panel_members', 'panel_member')
        .andWhere('panel_member.user_id = :userId', { userId: user.sub });
    }

    const interviews = await interviewsQuery.getCount();

    const offers = await this.offerRepository.count();

    return {
      jobOpenings,
      candidates,
      applications,
      interviews,
      offers,
    };
  }

  async getPipelineActivity(user: any) {
    const rawData = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.current_stage', 'stage')
      .addSelect('COUNT(application.id)', 'count')
      .groupBy('application.current_stage')
      .getRawMany();

    return rawData.map(row => ({
      stage: row.stage,
      count: parseInt(row.count, 10)
    }));
  }

  async getRecentActivity(user: AuthJwtPayload) {
    return this.activityLogRepository.find({
      order: { created_at: 'DESC' },
      take: 10,
      relations: ['action_by_user'],
    });
  }
}
