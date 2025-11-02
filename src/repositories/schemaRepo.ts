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
}
