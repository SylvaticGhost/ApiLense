import { join, dirname, fromFileUrl } from '@std/path';
import { ensureDir } from '@std/fs/ensure-dir';
import { initTestDatabaseWithPrisma } from '../utils/testDbInit.ts';

import { DependencyContainer } from '../../src/infrastructure/dependencyContainer.ts';
import { DependencyRegistration } from '../../src/infrastructure/dependencyRegistration.ts';
import { SchemaService } from '../../src/services/schemaService.ts';
import { TemplateFillingService } from '../../src/services/templateFillingService.ts';
import { TemplateFilling } from '../../src/core/templateFilling.ts';
import { EndpointService } from '../../src/services/endpointService.ts';
import { TemplateFillingRepository } from '../../src/repositories/templateFillingRepository.ts';
import { TestService } from '../../src/services/testService.ts';

const __dirname = dirname(fromFileUrl(import.meta.url));
const projectRoot = join(__dirname, '../../');

const prismaSchemaPath = join(projectRoot, 'prisma', 'schema.prisma');
const volumePath = join(projectRoot, 'volume');
const testDbRelative = join('volume', 'apilens.bench.db');
const testDbFile = join(projectRoot, testDbRelative);

const schemaLocationPath = join(projectRoot, 'volume', 'test-schemas');
const testApiSchemaPath = join(projectRoot, 'tests', 'content', 'testApiSchema.json');

// Setup preconditions (outside benches)
await initTestDatabaseWithPrisma(volumePath, prismaSchemaPath, testDbFile);
Deno.env.set('DATABASE_URL', `file:${testDbFile}`);
await ensureDir(schemaLocationPath);
Deno.env.set('SCHEMA_LOCATION', schemaLocationPath);
// bench mode flag to suppress logs in services
Deno.env.set('BENCH_MODE', '1');

const container = new DependencyContainer();
const registration = new DependencyRegistration(container);
await registration.registerAll();

const schemaService = container.resolve<SchemaService>('SchemaService');
const templateFillingService = container.resolve<TemplateFillingService>('TemplateFillingService');
const testService = container.resolve<TestService>('TestService');
const prisma = container.resolve<any>('PrismaClient');

// Prepare DB: create a group
const testGroup = await prisma.group.create({ data: { name: 'Benchmark Group', color: '#c0ffee' } });
const groupRef = testGroup.id.toString();

// load schema via mocked fetch
const fakeUrl = 'https://benchmark.example.com/test-openapi.json';
const schemaJsonText = await Deno.readTextFile(testApiSchemaPath);

globalThis.fetch = (async (input: Request | URL | string) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (url === fakeUrl) {
    return new Response(schemaJsonText, { status: 200, headers: { 'content-type': 'application/json' } });
  }
  // Simulate endpoint response (10ms latency)
  await new Promise((res) => setTimeout(res, 10));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof globalThis.fetch;

// Load schema and create a template (use POST endpoint)
const loadResult = await schemaService.loadSchema({ url: fakeUrl, file: undefined, name: 'Benchmark Schema', group: groupRef });
if (!loadResult.isSuccess()) throw new Error('Schema load failed for benchmark setup');
const schemaId = loadResult.castValue<number>();

// Use a simpler POST endpoint that has no complex body structure
const templateEndpointName = '/api/application/{offerId}/apply';
const templateName = 'bench_template';
const templateResult = await templateFillingService.createEndpointTemplate({ schemaId: schemaId!, endpointName: templateEndpointName, templateName });
if (!templateResult.isSuccess()) throw new Error('Template creation failed in benchmark setup');
let templateFilling = templateResult.castValueStrict<any>();

// We may encounter mismatches where parser interprets some schema types in an unexpected way
// (e.g. System.TimeSpan with properties). To ensure the template filling matches the template
// shape validated by TemplateFillingValidator, rebuild it using TemplateFilling.create and
// overwrite the saved file via repository.save.
if (templateFilling) {
  const endpointService = container.resolve<EndpointService>('EndpointService');
  const tfRepo = container.resolve<TemplateFillingRepository>('TemplateFillingRepository');
  const endpointResult = await endpointService.getEndpointByRef(schemaId!, templateEndpointName);
  if (endpointResult.isSuccess()) {
    const endpoint = endpointResult.castValueStrict<any>();
    const rebuilt = TemplateFilling.create(
      templateFilling.name,
      schemaId!,
      endpoint,
      endpoint.template,
    );
    // Save overwrites the repository file
    await tfRepo.save(rebuilt);
    templateFilling = rebuilt;
  }
}

// Bench parameters
const sizes = [50, 200, 500];
const concurrencies = [4, 8, 16];
const delayMs = 10; // simulated latency

// POST-style benches (templated requests)
for (const size of sizes) {
  for (const concurrency of concurrencies) {
    Deno.bench({
      name: `TestService.runMultipleRequests POST size=${size} conc=${concurrency}`,
      group: 'POST with template',
      fn: async () => {
        const res = await testService.runEndpoint({ schema: schemaId!, endpoint: templateEndpointName, template: templateFilling.name, numberOfRequests: size, concurrency, delayMs, mode: 'multiple' });
        if (!res.isSuccess()) throw new Error(`runEndpoint POST returned ${res.errorMessage}`);
      },
    });
  }
}

// Prepare a template for GET-style benches to avoid 'No template...' logs
const getEndpoint = 'work';
const getTemplateName = 'bench_template_get';
let getTemplateFillingName = '';
{
  const endpointService = container.resolve<EndpointService>('EndpointService');
  const tfRepo = container.resolve<TemplateFillingRepository>('TemplateFillingRepository');
  const endpointResult = await endpointService.getEndpointByRef(schemaId!, getEndpoint);
  if (!endpointResult.isSuccess()) throw new Error(`Endpoint ${getEndpoint} not found in schema ${schemaId}`);
  const endpoint = endpointResult.castValueStrict<any>();
  const created = TemplateFilling.create(getTemplateName, schemaId!, endpoint, endpoint.template);
  await tfRepo.save(created);
  getTemplateFillingName = created.name;
}
for (const size of sizes) {
  for (const concurrency of concurrencies) {
    Deno.bench({
      name: `TestService.runMultipleRequests GET size=${size} conc=${concurrency}`,
      group: 'GET no-template',
      fn: async () => {
        const res = await testService.runEndpoint({ schema: schemaId!, endpoint: getEndpoint, template: getTemplateFillingName, numberOfRequests: size, concurrency, delayMs, mode: 'multiple' });
        if (!res.isSuccess()) throw new Error(`runEndpoint GET returned ${res.errorMessage}`);
      },
    });
  }
}
