import { ApiSchema } from '../core/apiSchema.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';

export class SchemaRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(schema: ApiSchema) {
    await this.prismaClient.schema.create({
      data: {
        id: schema.id,
        name: schema.name,
        url: schema.url ?? '',
        filePath: schema.filePath ?? '',
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        groupId: schema.groupId ?? 0,
      },
    });
  }

  async isNameUsed(name: string): Promise<boolean> {
    const result = await this.prismaClient.schema.findFirst({
      where: {
        name: name,
      },
    });
    return result !== null;
  }

  async lastId(): Promise<number> {
    const last = await this.prismaClient.schema.findFirst({
      orderBy: { id: 'desc' },
    });
    return last?.id ?? 0;
  }

  async getById(id: number): Promise<ApiSchema | null> {
    const record = await this.prismaClient.schema.findUnique({
      where: { id: id },
    });
    if (!record) {
      return null;
    }

    return new ApiSchema(
      record.id,
      record.name,
      record.createdAt,
      record.updatedAt,
      record.groupId || undefined,
      record.url || undefined,
      record.filePath || undefined,
    );
  }

  async deleteById(id: number): Promise<void> {
    await this.prismaClient.schema.delete({
      where: { id: id },
    });
  }

  async deleteByGroupId(groupId: number): Promise<void> {
    await this.prismaClient.schema.deleteMany({
      where: { groupId },
    });
  }

  async transferBetweenGroups(fromGroupId: number, toGroupId: number) {
    return await this.prismaClient.schema.updateMany({
      where: { groupId: fromGroupId },
      data: { groupId: toGroupId },
    });
  }

  async list(skip: number, take: number, groupFilter?: string) {
    const where: any = {};

    if (groupFilter) {
      const num = Number(groupFilter);
      const conditions: any[] = [{ name: { contains: groupFilter } }];

      // If filter is a number, it could be an ID
      if (!isNaN(num)) {
        conditions.push({ id: num });
      }

      where.Group = {
        OR: conditions,
      };
    }

    return await this.prismaClient.schema.findMany({
      where,
      skip,
      take,
      include: {
        Group: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
}
