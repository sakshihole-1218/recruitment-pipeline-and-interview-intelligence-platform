import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { DepartmentEntity } from '../../departments/entities/department.entity';
import { UserEntity } from '../../accessControl/entities/user.entity';
import { SkillEntity } from '../../skills/entities/skill.entity';

@Injectable()
export class JobOpeningReferenceRepository {
  async departmentExists(
    departmentId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const repo = manager.getRepository(DepartmentEntity);
    const department = await repo
      .createQueryBuilder('departments')
      .select(['departments.id'])
      .where('departments.id = :id', { id: departmentId })
      .andWhere('departments.deleted_at IS NULL')
      .getOne();

    return Boolean(department);
  }

  async userExists(userId: string, manager: EntityManager): Promise<boolean> {
    const repo = manager.getRepository(UserEntity);
    const user = await repo
      .createQueryBuilder('users')
      .select(['users.id'])
      .where('users.id = :id', { id: userId })
      .andWhere('users.deleted_at IS NULL')
      .getOne();

    return Boolean(user);
  }

  async findSkillsByIds(
    skillIds: string[],
    manager: EntityManager,
  ): Promise<SkillEntity[]> {
    if (!skillIds.length) {
      return [];
    }

    const repo = manager.getRepository(SkillEntity);
    return repo
      .createQueryBuilder('skills')
      .where('skills.id IN (:...ids)', { ids: skillIds })
      .andWhere('skills.deleted_at IS NULL')
      .getMany();
  }
}
