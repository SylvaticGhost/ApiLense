import {ApiSchema} from "../core/api-schema.ts";
import {PrismaClient} from "../../prisma/generated/client.ts";

export class SchemaRepository {
  constructor(private readonly prismaClient: PrismaClient) {
  }

  async save(schema: ApiSchema) {
    await this.prismaClient.schema.create({
      data: {
        id: schema.id,
        name: schema.name,
        url: schema.url,
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        groupId: schema.groupId ?? 0,
      }
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
      orderBy: { id: "desc" },
    });
    return last?.id ?? 0;
  }
}
