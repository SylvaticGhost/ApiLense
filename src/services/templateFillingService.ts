import { TemplateFillingNewArgs } from '../contracts/templateFillingCommandsArgs.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { Endpoint } from '../core/endpoint.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { TemplateFillingRepository } from '../repositories/templateFillingRepository.ts';
import { Guard } from '../utils/guard.ts';
import { Result } from '../utils/result.ts';
import { TypedResult } from '../utils/typedResult.ts';
import { TemplateFillingValidator } from '../validators/templateFillingValidator.ts';
import { EndpointService } from './endpointService.ts';

export class TemplateFillingService {
  constructor(
    private readonly schemaRepo: SchemaRepository,
    private readonly templateFillingRepository: TemplateFillingRepository,
    private readonly endpointService: EndpointService,
  ) {}

  /**
   * Creates a new template filling for a specified endpoint within a schema.
   * @param schemaId - The ID of the schema containing the endpoint.
   * @param endpointName - The name of the endpoint to create a filling for.
   * @param templateName - The desired name for the new template filling.
   * @returns A Result object containing the created {@link TemplateFilling} on success, or an error message on failure.
   */
  async createEndpointTemplate({
    schemaId,
    endpointName,
    templateName,
  }: TemplateFillingNewArgs): Promise<Result> {
    const resultBuilder = Result.newBuilder();

    Guard.against.negative(schemaId, 'schemaId');
    const schema: ApiSchema | null = await this.schemaRepo.getById(schemaId);
    if (!schema) {
      return resultBuilder.notFound(`Schema with ID ${schemaId} not found`);
    }

    const endpointResult = await this.endpointService.getEndpointByRef(
      schemaId,
      endpointName,
    );

    if (!endpointResult.isSuccess()) {
      return resultBuilder.notFound(
        `Endpoint "${endpointName}" not found in schema ID ${schemaId}`,
      );
    }

    const endpoint: Endpoint = endpointResult.castValueStrict<Endpoint>();

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

  async listTemplates(
    schemaId: number,
    endpointName: string,
  ): Promise<TypedResult<TemplateFilling[]>> {
    const endpointResult = await this.endpointService.getEndpointByRef(
      schemaId,
      endpointName,
    );
    if (endpointResult.isFailure()) {
      return TypedResult.notFound<TemplateFilling[]>(
        `Endpoint "${endpointName}" in schema ID ${schemaId} not found`,
      );
    }

    const templates: TemplateFilling[] =
      await this.templateFillingRepository.getAllByEndpoint(
        schemaId,
        endpointName,
      );

    return TypedResult.success<TemplateFilling[]>(templates);
  }

  async getTemplate(
    schemaId: number,
    endpointName: string,
    templateFillingName: string,
  ): Promise<Result> {
    const endpointResult = await this.endpointService.getEndpointByRef(
      schemaId,
      endpointName,
    );
    if (endpointResult.isFailure()) {
      return Result.notFound(
        `Endpoint "${endpointName}" in schema ID ${schemaId} not found`,
      );
    }

    const endpoint: Endpoint = endpointResult.castValueStrict<Endpoint>();

    const templateFilling = await this.templateFillingRepository.get(
      schemaId,
      endpointName,
      templateFillingName,
    );

    if (!templateFilling) {
      return Result.notFound(
        `Template filling "${templateFillingName}" for endpoint "${endpointName}" in schema ID ${schemaId} not found`,
      );
    }

    const validationResult = TemplateFillingValidator.isValid(
      templateFilling,
      endpoint.template,
    );

    if (validationResult.isFailure()) return validationResult;

    return Result.success(templateFilling);
  }
}
