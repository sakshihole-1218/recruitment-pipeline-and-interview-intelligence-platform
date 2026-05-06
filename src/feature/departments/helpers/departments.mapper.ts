import { DepartmentEntity } from '../entities/department.entity';
import { DepartmentResponseDto } from '../dto/department.response.dto';

export class DepartmentsMapper {
  static toResponse(entity: DepartmentEntity): DepartmentResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
