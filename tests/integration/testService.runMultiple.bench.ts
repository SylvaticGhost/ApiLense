import { assert, assertEquals } from '@std/assert';
import { ensureDir } from '@std/fs';
import { join, dirname, fromFileUrl } from '@std/path';

import { DependencyContainer } from '../../src/infrastructure/dependencyContainer.ts';
import { DependencyRegistration } from '../../src/infrastructure/dependencyRegistration.ts';

import { SchemaService } from '../../src/services/schemaService.ts';
import { TemplateFillingService } from '../../src/services/templateFillingService.ts';
import { TestService } from '../../src/services/testService.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';

const __dirname = dirname(fromFileUrl(import.meta.url));
const projectRoot = join(__dirname, '../../');

const prismaSchemaPath = join(projectRoot, 'prisma', 'schema.prisma');
const volumePath = join(projectRoot, 'volume');
const testDbRelative = join('volume', 'apilens.test.db');
const testDbFile = join(projectRoot, testDbRelative);

const schemaLocationPath = join(projectRoot, 'volume', 'test-schemas');
const testApiSchemaPath = join(projectRoot, 'tests', 'content', 'testApiSchema.json');

async function initTestDatabaseWithPrisma() {
  await ensureDir(volumePath);

  try {
    await Deno.remove(testDbFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      'npm:prisma',
      'db',
      'push',
      '--schema',
      prismaSchemaPath,
    ],
    env: {
      DATABASE_URL: `file:${testDbFile}`,
    },
  });

  const { code, stderr } = await command.output();

  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr);
    throw new Error(`Prisma db push failed: ${errText}`);
  }
}

await initTestDatabaseWithPrisma();

Deno.env.set('DATABASE_URL', `file:${testDbFile}`);
await ensureDir(schemaLocationPath);
Deno.env.set('SCHEMA_LOCATION', schemaLocationPath);

// Setup once (outside benches): DI, load schema, create template using templateFillingService
const container = new DependencyContainer();
const registration = new DependencyRegistration(container);
await registration.registerAll();

const schemaService = container.resolve<SchemaService>('SchemaService');
const templateFillingService = container.resolve<TemplateFillingService>('TemplateFillingService');
const testService = container.resolve<TestService>('TestService');
const prisma = container.resolve<PrismaClient>('PrismaClient');

// Prepare DB group
const testGroup = await prisma.group.create({
  data: { name: 'Benchmark Group', color: '#c0ffee' },
});
const groupRef = testGroup.id.toString();

// Mock schema load via URL
const fakeUrl = 'https://benchmark.example.com/test-openapi.json';
const schemaJsonText = await Deno.readTextFile(testApiSchemaPath);

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: Request | URL | string) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (url === fakeUrl) {
    return new Response(schemaJsonText, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  // Simulate API endpoint responses: predictable latency
  await new Promise((res) => setTimeout(res, 10));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' }});
}) as typeof globalThis.fetch;

Deno.env.set('BENCH_MODE', '1');

const loadResult = await schemaService.loadSchema({
  url: fakeUrl,
  file: undefined,
  name: 'Benchmark Schema',
  group: groupRef,
});
if (!loadResult.isSuccess()) throw new Error('Failed to load schema in setup');
const schemaId = loadResult.castValue<number>();

// Create a template for a POST endpoint. This is a precondition for the benchmark.
const templateEndpointName = '/api/offer/create';
const templateName = 'bench_template';
const templateResult = await templateFillingService.createEndpointTemplate({
  schemaId: schemaId!,
  endpointName: templateEndpointName,
  templateName,
});
if (!templateResult.isSuccess()) throw new Error('Template creation failed in setup');
const templateFilling = templateResult.castValueStrict<any>();
const templatePath = templateFilling.filePath();

// Use a GET endpoint for the benchmark if desired, or use the `templateEndpointName` with templateName to run templated POST benchmark
// We'll make two benches: one with GET (no template) and one with POST (with template)

const sizes = [50, 200, 500];
const concurrencies = [4, 8, 16];
const delayMs = 10; // 10ms latency per user's request

// POST template benches
for (const size of sizes) {
  for (const concurrency of concurrencies) {
    Deno.bench({
      name: `TestService.runMultipleRequests POST size=${size} conc=${concurrency}`,
      group: 'POST with template',
      fn: async () => {
        const runResult = await testService.runEndpoint({
          schema: schemaId!,
          endpoint: templateEndpointName,
          template: templateFilling.name,
          numberOfRequests: size,
          concurrency,
          delayMs,
          mode: 'multiple',
        });
        if (!runResult.isSuccess()) throw new Error(`RunEndpoint failed: ${runResult.errorMessage}`);
      },
    });
  }
}

// GET benches (no template)
const getEndpoint = 'work';
for (const size of sizes) {
  for (const concurrency of concurrencies) {
    Deno.bench({
      name: `TestService.runMultipleRequests GET size=${size} conc=${concurrency}`,
      group: 'GET no-template',
      fn: async () => {
        const runResult = await testService.runEndpoint({
          schema: schemaId!,
          endpoint: getEndpoint,
          template: '',
          numberOfRequests: size,
          concurrency,
          delayMs,
          mode: 'multiple',
        });
        if (!runResult.isSuccess()) throw new Error(`RunEndpoint failed: ${runResult.errorMessage}`);
      },
    });
  }
}

// note: do not restore fetch or disconnect prisma here — benchmarks run afterwards and require those services available
