import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOpeningEntity } from '../../job-openings/entities/job-opening.entity';
import { CandidateEntity } from '../../candidates/entities/candidate.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { InterviewEntity } from '../../interviews/entities/interview.entity';
import { OfferEntity } from '../../offers/entities/offer.entity';
import { ActivityLogEntity } from '../../activityLogs/entities/activity-log.entity';
import { SystemRoleCode } from '../../accessControl/enums/system-role-code.enum';
import { AuthJwtPayload } from '../../auth/helpers/jwt-payload.helper';

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

  async getStats(user: any) {
    // Basic global count for now.
    const jobOpenings = await this.jobOpeningRepository.count();
    const candidates = await this.candidateRepository.count();
    const applications = await this.applicationRepository.count();
    const interviews = await this.interviewRepository.count();
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
