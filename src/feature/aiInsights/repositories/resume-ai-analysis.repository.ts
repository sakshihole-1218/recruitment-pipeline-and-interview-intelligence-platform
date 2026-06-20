import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListResumeAiAnalysesQueryDto } from '../dto/list-resume-ai-analyses.query.dto';
import { ResumeAiAnalysisEntity } from '../entities/resume-ai-analysis.entity';

export type ResumeAiAnalysisListResult =
  | {
      mode: 'offset';
      data: ResumeAiAnalysisEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: ResumeAiAnalysisEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class ResumeAiAnalysisRepository {
  constructor(
    @InjectRepository(ResumeAiAnalysisEntity)
    private readonly repository: Repository<ResumeAiAnalysisEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<ResumeAiAnalysisEntity> {
    return manager
      ? manager.getRepository(ResumeAiAnalysisEntity)
      : this.repository;
  }

  private baseQuery(
    alias = 'resume_ai_analyses',
    manager?: EntityManager,
  ): SelectQueryBuilder<ResumeAiAnalysisEntity> {
    return this.repo(manager)
      .createQueryBuilder(alias)
      .where(`${alias}.deleted_at IS NULL`);
  }

  async findById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.baseQuery('resume_ai_analyses', options?.manager)
      .andWhere('resume_ai_analyses.id = :id', { id })
      .getOne();
  }

  // --- requested method names (wrappers) ---
  createResumeAnalysis(
    payload: Partial<ResumeAiAnalysisEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity> {
    return this.createAndSave(payload, options);
  }

  findResumeAnalysisById(
    id: string,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.findById(id, options);
  }

  findByCandidateDocumentId(
    candidateDocumentId: string,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.findActiveByCandidateDocumentId(candidateDocumentId, options);
  }

  async findLatestByCandidateId(
    candidateId: string,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.baseQuery('resume_ai_analyses', options?.manager)
      .andWhere('resume_ai_analyses.candidate_id = :candidateId', {
        candidateId,
      })
      .orderBy('resume_ai_analyses.created_at', 'DESC')
      .addOrderBy('resume_ai_analyses.id', 'ASC')
      .getOne();
  }

  findAllResumeAnalysesWithFilters(
    query: ListResumeAiAnalysesQueryDto,
  ): Promise<ResumeAiAnalysisListResult> {
    return this.list(query);
  }

  async existsActiveAnalysisForDocument(
    candidateDocumentId: string,
    options?: { manager?: EntityManager },
  ): Promise<boolean> {
    const existing = await this.findActiveByCandidateDocumentId(
      candidateDocumentId,
      options,
    );
    return Boolean(existing);
  }

  updateResumeAnalysis(
    entity: ResumeAiAnalysisEntity,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity> {
    return this.save(entity, options);
  }

  async softDeleteResumeAnalysis(
    id: string,
    options: { actorUserId: string; manager?: EntityManager },
  ): Promise<void> {
    const now = new Date();
    await this.repo(options.manager)
      .createQueryBuilder()
      .update(ResumeAiAnalysisEntity)
      .set({
        deleted_at: now,
        deleted_by_user_id: options.actorUserId,
        updated_at: now,
        updated_by_user_id: options.actorUserId,
      })
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  async findActiveByCandidateDocumentId(
    candidateDocumentId: string,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity | null> {
    return this.baseQuery('resume_ai_analyses', options?.manager)
      .andWhere(
        'resume_ai_analyses.candidate_document_id = :candidateDocumentId',
        {
          candidateDocumentId,
        },
      )
      .getOne();
  }

  async createAndSave(
    payload: Partial<ResumeAiAnalysisEntity>,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async save(
    entity: ResumeAiAnalysisEntity,
    options?: { manager?: EntityManager },
  ): Promise<ResumeAiAnalysisEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async list(
    query: ListResumeAiAnalysesQueryDto,
  ): Promise<ResumeAiAnalysisListResult> {
    const qb = this.baseQuery('resume_ai_analyses');

    if (query.candidate_document_id) {
      qb.andWhere(
        'resume_ai_analyses.candidate_document_id = :candidateDocumentId',
        {
          candidateDocumentId: query.candidate_document_id,
        },
      );
    }

    if (query.candidate_id) {
      qb.andWhere('resume_ai_analyses.candidate_id = :candidateId', {
        candidateId: query.candidate_id,
      });
    }

    if (query.application_id) {
      qb.andWhere('resume_ai_analyses.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.search && String(query.search).trim()) {
      const search = `%${String(query.search).trim()}%`;
      qb.andWhere(
        `(
          COALESCE(resume_ai_analyses.extracted_text, '') ILIKE :search
          OR COALESCE(resume_ai_analyses.experience_summary, '') ILIKE :search
          OR COALESCE(resume_ai_analyses.education_summary, '') ILIKE :search
          OR COALESCE(resume_ai_analyses.project_summary, '') ILIKE :search
          OR COALESCE(resume_ai_analyses.certification_summary, '') ILIKE :search
        )`,
        { search },
      );
    }

    if (query.analysis_status) {
      qb.andWhere('resume_ai_analyses.analysis_status = :status', {
        status: query.analysis_status,
      });
    }

    if (query.analyzed_from) {
      const from = new Date(query.analyzed_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid analyzed_from date',
          code: 'INVALID_ANALYZED_FROM',
        });
      }
      qb.andWhere('resume_ai_analyses.analyzed_at >= :from', { from });
    }

    if (query.analyzed_to) {
      const to = new Date(query.analyzed_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid analyzed_to date',
          code: 'INVALID_ANALYZED_TO',
        });
      }
      qb.andWhere('resume_ai_analyses.analyzed_at <= :to', { to });
    }

    const orderDirection =
      (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    const allowedSort = [
      'created_at',
      'updated_at',
      'analyzed_at',
      'analysis_status',
    ] as const;

    if (!allowedSort.includes(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`resume_ai_analyses.${sortBy}`, orderDirection);
    qb.addOrderBy('resume_ai_analyses.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      if ((query.sort_by || 'created_at') !== 'created_at') {
        throw new BadRequestException({
          message:
            'Cursor pagination is only supported with sort_by=created_at',
          code: 'CURSOR_SORT_BY_REQUIRED',
        });
      }

      const cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid pagination cursor',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('resume_ai_analyses.created_at < :cursorDate', {
          cursorDate,
        });
      } else {
        qb.andWhere('resume_ai_analyses.created_at > :cursorDate', {
          cursorDate,
        });
      }

      const idRows = await qb
        .clone()
        .select([
          'resume_ai_analyses.id AS id',
          'resume_ai_analyses.created_at AS created_at',
        ])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('resume_ai_analyses')
            .andWhere('resume_ai_analyses.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids
        .map((id) => byId.get(id))
        .filter((d): d is ResumeAiAnalysisEntity => Boolean(d));

      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1]?.created_at
          ? new Date(pageRows[pageRows.length - 1].created_at).toISOString()
          : null
        : null;

      return {
        mode: 'cursor',
        data,
        limit,
        next_cursor: nextCursor,
        has_more: hasMore,
      };
    }

    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const countQb = qb.clone();
    countQb.expressionMap.orderBys = {};

    const totalRaw = await countQb
      .select('COUNT(DISTINCT resume_ai_analyses.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select([
        'resume_ai_analyses.id AS id',
        `resume_ai_analyses.${sortBy} AS sort_value`,
      ])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('resume_ai_analyses')
          .andWhere('resume_ai_analyses.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids
      .map((id) => byId.get(id))
      .filter((d): d is ResumeAiAnalysisEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}
