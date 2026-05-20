import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationEntity } from '../../applications/entities/application.entity';
import { OfferStatus } from '../enums/offer-status.enum';

@Entity({ name: 'offers' })
export class OfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @ManyToOne(() => ApplicationEntity)
  @JoinColumn({ name: 'application_id' })
  application?: ApplicationEntity;

  @Column({ type: 'varchar', length: 200 })
  offered_role_title: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  offered_ctc: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  joining_bonus: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency_code: string | null;

  @Column({ type: 'int', nullable: true })
  probation_period_months: number | null;

  @Column({ type: 'timestamptz' })
  expected_joining_date: Date;

  @Column({ type: 'varchar', length: 20 })
  offer_status: OfferStatus;

  @Column({ type: 'timestamptz', nullable: true })
  offered_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  declined_at: Date | null;

  @Column({ type: 'text', nullable: true })
  decline_reason: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  created_by_user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by_user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  deleted_by_user_id: string | null;
}
