import { Endpoint } from '../core/endpoint.ts';
import { EndpointRepository } from '../repositories/endpointRepository.ts';
import { EndpointMetaDataRepository } from '../repositories/enpointMetaDataRepository.ts';
import { Result } from '../utils/result.ts';

export class EndpointService {
  constructor(
    private readonly endpointRepo: EndpointRepository,
    private readonly endpointMetaDataRepository: EndpointMetaDataRepository,
  ) {}

  async getEndpointByRef(
    schemaId: number,
    endpointRef: string,
  ): Promise<Result> {
    const metaData = await this.endpointMetaDataRepository.getByStringParameter(
      schemaId,
      endpointRef,
    );

    if (!metaData)
      return Result.notFound(
        `Endpoint with reference '${endpointRef}' not found in schema ID ${schemaId}`,
      );

    const endpointSearchClause = Endpoint.fileName(
      metaData.path,
      metaData.method,
    );

    const endpoint: Endpoint | null = await this.endpointRepo.getEndpoint(
      schemaId,
      endpointSearchClause,
    );

    if (!endpoint)
      return Result.notFound(
        `Endpoint '${endpointSearchClause}' not found in schema ID ${schemaId}`,
      );

    return Result.success(endpoint);
  }
}
