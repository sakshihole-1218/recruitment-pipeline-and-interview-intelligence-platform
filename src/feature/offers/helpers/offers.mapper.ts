import { OfferEntity } from '../entities/offer.entity';
import { OfferResponseDto } from '../dto/offer.response.dto';

export class OffersMapper {
  static toOfferResponse(entity: OfferEntity): OfferResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      offered_role_title: entity.offered_role_title,
      offered_ctc: entity.offered_ctc,
      joining_bonus: entity.joining_bonus,
      currency_code: entity.currency_code,
      probation_period_months: entity.probation_period_months,
      expected_joining_date: entity.expected_joining_date,
      offer_status: entity.offer_status,
      offered_at: entity.offered_at,
      accepted_at: entity.accepted_at,
      declined_at: entity.declined_at,
      decline_reason: entity.decline_reason,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
