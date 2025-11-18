import { PrismaClient } from '../../prisma/generated/client.ts';
import { EndpointMetaData } from '../core/endpoint.ts';
import { HttpMethod } from '../core/enums.ts';

export class EndpointMetaDataRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async saveAll(metaDatas: EndpointMetaData[]): Promise<void> {
    const createManyData = metaDatas.map((metaData) => ({
      schemaId: metaData.schemaId,
      name: metaData.name,
      method: metaData.method,
      path: metaData.path,
    }));

    await this.prismaClient.endpointMetaData.createMany({
      data: createManyData,
    });
  }

  async deleteBySchemaId(schemaId: number): Promise<void> {
    await this.prismaClient.endpointMetaData.deleteMany({
      where: { schemaId: schemaId },
    });
  }

  async getByStringParameter(
    schemaId: number,
    parameter: string,
  ): Promise<EndpointMetaData | null> {
    const value = await this.prismaClient.endpointMetaData.findFirst({
      where: {
        schemaId: schemaId,
        OR: [
          { name: { equals: parameter } },
          { path: { equals: parameter } },
          { name: { contains: parameter } },
          { path: { contains: parameter } },
        ],
      },
    });

    if (!value) return null;

    return new EndpointMetaData(
      value.schemaId,
      value.name,
      value.method as HttpMethod,
      value.path,
    );
  }
}
