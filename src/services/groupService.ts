import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { Result } from '../utils/result.ts';

export class GroupService {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly schemaRepo: SchemaRepository,
  ) {}

  async createGroup(name: string, color?: string): Promise<Result> {
    // ensure unique name
    const exists = await this.groupRepo.getByName(name);
    if (exists) return Result.badRequest(`Group with name ${name} already exists`);

    const created = await this.groupRepo.create(name, color);
    return Result.success(created.id);
  }

  async updateGroup(id: number, name?: string, color?: string): Promise<Result> {
    // if name provided check unique (excluding same id)
    if (name) {
      const existing = await this.groupRepo.getByName(name);
      if (existing && existing.id !== id) {
        return Result.badRequest(`Group with name ${name} already exists`);
      }
    }

    await this.groupRepo.update(id, { name, color });
    // No textual payload required for consumers; return success without arbitrary text
    return Result.success();
  }

  async deleteGroup(id: number, moveToDefault = false): Promise<Result> {
    const group = await this.groupRepo.getById(id);
    if (!group) return Result.notFound(`Group with id ${id} not found`);

    // Prevent accidental deletion of the default group
    if (id === 0) return Result.badRequest('Default group cannot be deleted');

    if (moveToDefault) {
      // default group id expected to be 0
      const defaultId = 0;
      await this.schemaRepo.transferBetweenGroups(id, defaultId);
      await this.groupRepo.deleteById(id);
      return Result.success('Group deleted and schemas moved to default');
    } else {
      // delete schemas in group in a single DB call
      await this.schemaRepo.deleteByGroupId(id);
      await this.groupRepo.deleteById(id);
      return Result.success('Group and its schemas deleted');
    }
  }

  async listGroups(page = 1, size = 10) {
    const skip = (page - 1) * size;
    return await this.groupRepo.list(skip, size);
  }
}
