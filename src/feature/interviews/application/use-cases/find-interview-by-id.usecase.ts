import { Injectable, NotFoundException } from '@nestjs/common';

import { InterviewRepository } from '../../repositories/interview.repository';

@Injectable()
export class FindInterviewByIdUseCase {
  constructor(private readonly interviewRepository: InterviewRepository) {}

  async execute(id: string) {
    const interview = await this.interviewRepository.findById(id, {
      withRelations: true,
    });

    if (!interview) {
      throw new NotFoundException({
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND',
      });
    }

    return interview;
  }
}
