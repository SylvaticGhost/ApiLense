import { EndpointFillingNewArgs } from '../contracts/endpointFillingCommandsArgs.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { Endpoint } from '../core/endpoint.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { EndpointRepository } from '../repositories/endpointRepository.ts';
import { EndpointMetaDataRepository } from '../repositories/enpointMetaDataRepository.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { TemplateFillingRepository } from '../repositories/templateFillingRepository.ts';
import { Guard } from '../utils/guard.ts';
import { Result } from '../utils/result.ts';

export class TemplateFillingService {
  constructor(
    private readonly endpointRepo: EndpointRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly templateFillingRepository: TemplateFillingRepository,
    private readonly endpointMetaDataRepository: EndpointMetaDataRepository,
  ) {}

  /**
   * Creates a new template filling for a specified endpoint within a schema.
   * @param schemaId - The ID of the schema containing the endpoint.
   * @param endpointName - The name of the endpoint to create a filling for.
   * @param templateName - The desired name for the new template filling.
   * @returns A Result object containing the created {@link TemplateFilling} on success, or an error message on failure.
   */
  async createEndpointTemplateTemplate({
    schemaId,
    endpointName,
    templateName,
  }: EndpointFillingNewArgs): Promise<Result> {
    const resultBuilder = Result.newBuilder();

    Guard.against.negative(schemaId, 'schemaId');
    const schema: ApiSchema | null = await this.schemaRepo.getById(schemaId);
    if (!schema) {
      return resultBuilder.notFound(`Schema with ID ${schemaId} not found`);
    }

    const metaData = await this.endpointMetaDataRepository.getByStringParameter(
      schema.id,
      endpointName,
    );

    if (!metaData) {
      return resultBuilder.notFound(
        `Endpoint metadata "${endpointName}" not found in schema ID ${schemaId}`,
      );
    }

    const endpointSearchClause = Endpoint.fileName(
      metaData.path,
      metaData.method,
    );

    const endpoint: Endpoint | null = await this.endpointRepo.getEndpoint(
      schemaId,
      endpointSearchClause,
    );
    if (!endpoint) {
      return resultBuilder.notFound(
        `Endpoint "${endpointSearchClause}" not found in schema ID ${schemaId}`,
      );
    }

    const templateFilling: TemplateFilling = TemplateFilling.create(
      templateName || `${endpoint.name.replace(/\//g, '_')}_filling`,
      schema.id,
      endpoint,
      endpoint.template,
    );

    let i: number = 2;
    while (
      await this.templateFillingRepository.checkIfNameUsed(templateFilling)
    ) {
      templateFilling.updateName(`${templateName}_${i}`);
      i++;

      if (i > 50_000)
        throw new Error('Too many template fillings with the same name exist');
    }

    await this.templateFillingRepository.save(templateFilling);

    if (i > 2) {
      resultBuilder.withWarning(
        `Template with this name already exists. Created with name: ${templateFilling.name}`,
      );
    }

    return resultBuilder.success(templateFilling);
  }
}
