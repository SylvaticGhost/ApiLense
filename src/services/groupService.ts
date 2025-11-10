import { Result } from '../utils/result.ts';
import { GroupRepository } from '../repositories/groupRepo.ts';
import { Group } from '../core/group.ts';

interface CreateGroupArgs {
  name: string;
  color?: string;
}

export class GroupService {
  constructor(private readonly groupRepo: GroupRepository) {}

  /**
   * Створює нову групу.
   * @param args - Аргументи для створення групи.
   */
  async createGroup(args: CreateGroupArgs): Promise<Result<Group>> {
    const existingGroup = await this.groupRepo.getByName(args.name);
    if (existingGroup) {
      return Result.badRequest(
        `Group with name "${args.name}" already exists.`,
      );
    }

    const newId = (await this.groupRepo.lastId()) + 1;
    const now = new Date();

    const group = new Group(
      newId,
      args.name,
      now,
      now,
      args.color,
      [],
    );

    try {
      const createdGroup = await this.groupRepo.create(group);
      return Result.success(createdGroup);
    } catch (error) {
      return Result.failure(`Failed to create group: ${error.message}`, 500);
    }
  }
}