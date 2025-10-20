import { ApiSchema } from '../core/apiSchema.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';
import { SchemaFileRepository } from "./schemaFileRepo.ts";
import { GroupRepository } from "./groupRepo.ts";

export class SchemaRepository {
  private schemaRepo!: SchemaFileRepository;
  private groupRepo!: GroupRepository;
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(schema: ApiSchema) {
    return await this.prismaClient.schema.create({
      data: {
        id: schema.id,
        name: schema.name,
        url: schema.url ?? '',
        filePath: schema.filePath ?? '',
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        groupId: schema.groupId ?? 0,
        sourceType: schema.sourceType,
        source: schema.source,
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