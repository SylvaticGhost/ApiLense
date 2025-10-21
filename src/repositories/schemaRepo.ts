import { ApiSchema } from '../core/apiSchema.ts';
import { Group, PrismaClient, Schema } from '../../prisma/generated/client.ts';

export class SchemaRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

 async findMany(options: { groupName?: string; page?: number; size?: number }): Promise<(Schema & { Group: Group | null })[]> {
    const { groupName, page = 1, size = 10 } = options;
    const skip = (page - 1) * size;

    return await this.prismaClient.schema.findMany({
      where: {
        Group: groupName ? { name: groupName } : undefined,
      },
      include: {
        Group: true,
      },
      skip: skip,
      take: size,
    });
  }

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
}
