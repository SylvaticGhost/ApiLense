import { RunEndpointCommandArgs } from '../contracts/testCommandArgs.ts';
import { ApiCallReport } from '../core/apiCallReport.ts';
import { ApiCallRequest } from '../core/apiCallRequest.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { Endpoint } from '../core/endpoint.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { TestReport } from '../core/testReport.ts';
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

  async runEndpoint(parameters: RunEndpointCommandArgs): Promise<Result> {
    const {
      schema: schemaId,
      endpoint: endpointRef,
      template: templateRef,
      numberOfRequests,
      concurrency,
      delayMs,
      mode,
    } = parameters;

    const schema: ApiSchema | null = await this.schemaRepo.getById(schemaId);
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

    if (mode == 'multiple')
      return await this.runMultipleRequests(
        schema,
        endpoint,
        templateFilling,
        numberOfRequests,
        concurrency,
        delayMs,
      );
    else if (mode == 'progression')
      return await this.runProgressionRequests(
        schema,
        endpoint,
        templateFilling,
        concurrency,
        delayMs,
      );
    else return await this.runSingleRequest(schema, endpoint, templateFilling);
  }

  private async runSingleRequest(
    schema: ApiSchema,
    endpoint: Endpoint,
    filling: TemplateFilling | null,
  ): Promise<Result> {
    const request = ApiCallRequest.create(schema, endpoint, filling);
    const report = await this.requestRunner.run(request);
    const testReport = TestReport.single(report);
    return Result.success(testReport);
  }

  private async runMultipleRequests(
    schema: ApiSchema,
    endpoint: Endpoint,
    filling: TemplateFilling | null,
    numberOfRequests: number,
    concurrency: number,
    delayMs: number,
  ): Promise<Result> {
    const requestsByThread: ApiCallRequest[][] = ApiCallRequest.createMany(
      schema,
      endpoint,
      filling,
      concurrency,
      numberOfRequests,
    );

    const reports: ApiCallReport[][] = await this.requestRunner.runMultiple(
      requestsByThread,
      delayMs,
    );
    const testReport = TestReport.multiple(reports);
    return Result.success(testReport);
  }

  private async runProgressionRequests(
    schema: ApiSchema,
    endpoint: Endpoint,
    filling: TemplateFilling | null,
    concurrency: number,
    delayMs: number,
  ): Promise<Result> {
    const requests = ApiCallRequest.createProggression(
      schema,
      endpoint,
      filling,
      concurrency,
    );
    const reports: ApiCallReport[][] = await this.requestRunner.runConcurently(
      requests,
      delayMs,
    );
    const testReport = TestReport.progression(reports);
    return Result.success(testReport);
  }
}
