import { SkillEntity } from '../entities/skill.entity';
import { SkillResponseDto } from '../dto/skill.response.dto';

export class SkillsMapper {
  static toResponse(entity: SkillEntity): SkillResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      category: entity.category,
      is_active: entity.is_active,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
