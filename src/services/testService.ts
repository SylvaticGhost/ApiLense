import { ApiCallRequest } from '../core/apiCallRequest.ts';
import { Endpoint } from '../core/endpoint.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { RequestRunner } from '../infrastructure/requestRunner.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { FileUrl } from '../utils/fileUrl.ts';
import { Result } from '../utils/result.ts';
import { EndpointService } from './endpointService.ts';
import { TemplateFillingService } from './templateFillingService.ts';

export class TestService {
  constructor(
    private readonly endpointService: EndpointService,
    private readonly templateFillingService: TemplateFillingService,
    private readonly schemaRepo: SchemaRepository,
    private readonly requestRunner: RequestRunner,
  ) {}

  async runEndpoint(
    schemaId: number,
    endpointRef: string,
    templateRef: string,
  ): Promise<Result> {
    const schema = await this.schemaRepo.getById(schemaId);
    if (!schema) throw new Error(`Schema with id ${schemaId} not found`);

    const endpointGetResult = await this.endpointService.getEndpointByRef(
      schemaId,
      endpointRef,
    );

    if (!endpointGetResult.isSuccess()) return endpointGetResult;

    const endpoint = endpointGetResult.castValueStrict<Endpoint>();

    let templateFilling = null;
    if (templateRef) {
      const templateFillingGetResult =
        await this.templateFillingService.getTemplate(
          schemaId,
          endpoint.name,
          templateRef,
        );

      if (templateFillingGetResult.statusCode === 400) {
        const errorMsg = `${templateFillingGetResult.errorMessage}\n.
        Please review your template ${new FileUrl(
          TemplateFilling.filePath(schemaId, endpoint.name, templateRef),
          'CLICK',
        ).toString()}`;
        return Result.badRequest(errorMsg);
      }
      if (!templateFillingGetResult.isSuccess())
        return templateFillingGetResult;

      templateFilling = templateFillingGetResult.castValue<TemplateFilling>();
    }

    if (!templateFilling)
      console.log(
        `❯ No template filling provided by reference "${templateRef}"`,
      );

    const request = ApiCallRequest.create(schema, endpoint, templateFilling);

    const report = await this.requestRunner.run(request);

    return Result.success(report);
  }
}
