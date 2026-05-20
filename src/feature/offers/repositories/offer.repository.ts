import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ListOffersQueryDto } from '../dto/list-offers.query.dto';
import { OfferEntity } from '../entities/offer.entity';
import { OfferStatus } from '../enums/offer-status.enum';

export type OfferListResult =
  | {
      mode: 'offset';
      data: OfferEntity[];
      page: number;
      limit: number;
      total_records: number;
    }
  | {
      mode: 'cursor';
      data: OfferEntity[];
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    };

@Injectable()
export class OfferRepository {
  constructor(
    @InjectRepository(OfferEntity)
    private readonly repository: Repository<OfferEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<OfferEntity> {
    return manager ? manager.getRepository(OfferEntity) : this.repository;
  }

  private baseQuery(alias = 'offers', manager?: EntityManager): SelectQueryBuilder<OfferEntity> {
    return this.repo(manager).createQueryBuilder(alias).where(`${alias}.deleted_at IS NULL`);
  }

  async findById(id: string, options?: { manager?: EntityManager }): Promise<OfferEntity | null> {
    return this.baseQuery('offers', options?.manager)
      .andWhere('offers.id = :id', { id })
      .getOne();
  }

  async findLatestByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<OfferEntity | null> {
    return this.baseQuery('offers', options?.manager)
      .andWhere('offers.application_id = :applicationId', { applicationId })
      .orderBy('offers.created_at', 'DESC')
      .addOrderBy('offers.id', 'DESC')
      .getOne();
  }

  async findActiveByApplicationId(
    applicationId: string,
    options?: { manager?: EntityManager },
  ): Promise<OfferEntity | null> {
    return this.baseQuery('offers', options?.manager)
      .andWhere('offers.application_id = :applicationId', { applicationId })
      .andWhere('offers.offer_status IN (:...statuses)', {
        statuses: [OfferStatus.DRAFT, OfferStatus.SENT],
      })
      .getOne();
  }

  async createAndSave(
    payload: Partial<OfferEntity>,
    options?: { manager?: EntityManager },
  ): Promise<OfferEntity> {
    const entity = this.repo(options?.manager).create(payload);
    return this.repo(options?.manager).save(entity);
  }

  async save(entity: OfferEntity, options?: { manager?: EntityManager }): Promise<OfferEntity> {
    return this.repo(options?.manager).save(entity);
  }

  async list(query: ListOffersQueryDto): Promise<OfferListResult> {
    const qb = this.baseQuery('offers');

    if (query.application_id) {
      qb.andWhere('offers.application_id = :applicationId', {
        applicationId: query.application_id,
      });
    }

    if (query.offer_status) {
      qb.andWhere('offers.offer_status = :status', {
        status: query.offer_status,
      });
    }

    if (query.expected_joining_from) {
      const from = new Date(query.expected_joining_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid expected_joining_from date',
          code: 'INVALID_EXPECTED_JOINING_FROM',
        });
      }
      qb.andWhere('offers.expected_joining_date >= :from', { from });
    }

    if (query.expected_joining_to) {
      const to = new Date(query.expected_joining_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid expected_joining_to date',
          code: 'INVALID_EXPECTED_JOINING_TO',
        });
      }
      qb.andWhere('offers.expected_joining_date <= :to', { to });
    }

    if (query.offered_from) {
      const from = new Date(query.offered_from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException({
          message: 'Invalid offered_from date',
          code: 'INVALID_OFFERED_FROM',
        });
      }
      qb.andWhere('offers.offered_at >= :from', { from });
    }

    if (query.offered_to) {
      const to = new Date(query.offered_to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException({
          message: 'Invalid offered_to date',
          code: 'INVALID_OFFERED_TO',
        });
      }
      qb.andWhere('offers.offered_at <= :to', { to });
    }

    const orderDirection = (query.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    const sortBy = query.sort_by || 'created_at';

    if (!OFFER_SORTABLE_FIELDS.has(sortBy)) {
      throw new BadRequestException({
        message: 'Invalid sort_by field',
        code: 'INVALID_SORT_BY',
      });
    }

    qb.orderBy(`offers.${sortBy}`, orderDirection);
    qb.addOrderBy('offers.id', 'ASC');

    const limit = query.limit || 10;

    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException({
          message: 'Invalid pagination cursor',
          code: 'INVALID_CURSOR',
        });
      }

      if (orderDirection === 'DESC') {
        qb.andWhere('offers.created_at < :cursorDate', { cursorDate });
      } else {
        qb.andWhere('offers.created_at > :cursorDate', { cursorDate });
      }

      const idRows = await qb
        .clone()
        .select(['offers.id AS id', 'offers.created_at AS created_at'])
        .distinct(true)
        .take(limit + 1)
        .getRawMany<{ id: string; created_at: Date }>();

      const hasMore = idRows.length > limit;
      const pageRows = hasMore ? idRows.slice(0, limit) : idRows;
      const ids = pageRows.map((r) => r.id);

      const rows = ids.length
        ? await this.baseQuery('offers')
            .andWhere('offers.id IN (:...ids)', { ids })
            .getMany()
        : [];

      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const data = ids.map((id) => byId.get(id)).filter((d): d is OfferEntity => Boolean(d));

      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1]?.created_at
          ? new Date(pageRows[pageRows.length - 1]!.created_at).toISOString()
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
      .select('COUNT(DISTINCT offers.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRaw?.count || 0);

    const idRows = await qb
      .clone()
      .select(['offers.id AS id', `offers.${sortBy} AS sort_value`])
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string; sort_value: unknown }>();

    const ids = idRows.map((r) => r.id);

    const rows = ids.length
      ? await this.baseQuery('offers')
          .andWhere('offers.id IN (:...ids)', { ids })
          .getMany()
      : [];

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const data = ids.map((id) => byId.get(id)).filter((d): d is OfferEntity => Boolean(d));

    return {
      mode: 'offset',
      data,
      page,
      limit,
      total_records: total,
    };
  }
}

const OFFER_SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'offered_at',
  'expected_joining_date',
  'offer_status',
]);
