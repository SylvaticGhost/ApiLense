import {
  PrismaClient,
  Group as PrismaGroup,
  Schema as PrismaSchema,
} from '../../prisma/generated/client.ts';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { Group } from '../core/group.ts';
import { ApiSchema } from '../core/apiSchema.ts';

export class GroupRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(group: Group): Promise<Group> {
    const createdRecord = await this.prismaClient.group.create({
      data: {
        name: group.name,
        color: group.color ?? '',
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    });

    const mappedGroup = this.mapToDomain(createdRecord, []);
    if (mappedGroup === null) {
      throw new Error('Failed to map created group after creation.');
    }
    return mappedGroup;
  }

  async lastId(): Promise<number> {
    const last = await this.prismaClient.group.findFirst({
      orderBy: { id: 'desc' },
    });
    return last?.id ?? 0;
  }

  async exists(groupId: number): Promise<boolean> {
    const record = await this.prismaClient.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
    return record !== null;
  }

  async getByName(name: string): Promise<Group | null> {
    const raw = await this.prismaClient.group.findUnique({
      where: { name },
      include: { Schemas: true },
    });
    return this.mapToDomain(raw, raw?.Schemas);
  }

  async getById(id: number): Promise<Group | null> {
    const raw = await this.prismaClient.group.findUnique({
      where: { id: id },
      include: { Schemas: true },
    });
    return this.mapToDomain(raw, raw?.Schemas);
  }

  private mapToDomain(
    raw: PrismaGroup | null,
    schemas: PrismaSchema[] | undefined,
  ): Group | null {
    if (!raw) {
      return null;
    }

    const apiSchemas = (schemas ?? []).map(
      (s) =>
        new ApiSchema(
          s.id,
          s.name,
          s.createdAt,
          s.updatedAt,
          s.groupId ?? undefined,
          s.url ?? undefined,
          s.filePath ?? undefined,
        ),
    );

    return new Group(
      raw.id,
      raw.name,
      raw.createdAt,
      raw.updatedAt,
      raw.color ?? undefined,
      apiSchemas,
    );
  }
}