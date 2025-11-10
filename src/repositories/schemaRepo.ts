import { ApiSchema } from '../core/apiSchema.ts';
import {
  PrismaClient,
  Prisma,
  Schema,
  Group,
} from '../../prisma/generated/client.ts';

export class SchemaRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async save(schema: ApiSchema) {
    await this.prismaClient.schema.create({
      data: {
        // id генерується автоматично
        name: schema.name,
        url: schema.url ?? '',
        filePath: schema.filePath ?? '',
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        groupId: schema.groupId ?? null, // Використовуємо 'null' для "без групи"
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

  /**
   * МЕТОД, НЕОБХІДНИЙ ДЛЯ 'schema-list'
   * Знаходить схеми з опціональною фільтрацією та пагінацією.
   */
  async find(options: {
    groupId?: number;
    page: number;
    size?: number;
  }): Promise<(Schema & { Group: Group | null })[]> { // <--- ЗМІНЕНО ТИП
    const { groupId, page, size } = options;

    const skip = size ? (page - 1) * size : 0;
    const take = size;

    const where: Prisma.SchemaWhereInput = {};
    if (groupId) {
      where.groupId = groupId;
    }

    const schemas = await this.prismaClient.schema.findMany({
      where: where,
      include: {
        Group: true, // ⭐️ ВИПРАВЛЕНО ТУТ: 'group' -> 'Group'
      },
      orderBy: {
        name: 'asc',
      },
      skip: skip,
      take: take,
    });

    return schemas;
  }
}