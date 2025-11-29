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

Deno.test({
  name: 'benchmark: TestService.runMultipleRequests - measure performance with increasing number of requests',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await initTestDatabaseWithPrisma();

    Deno.env.set('DATABASE_URL', `file:${testDbFile}`);
    await ensureDir(schemaLocationPath);
    Deno.env.set('SCHEMA_LOCATION', schemaLocationPath);

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
      // Simulate API endpoint responses: small, predictable latency
      await new Promise((res) => setTimeout(res, 1));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' }});
    }) as typeof globalThis.fetch;

    try {
      const loadResult = await schemaService.loadSchema({
        url: fakeUrl,
        file: undefined,
        name: 'Benchmark Schema',
        group: groupRef,
      });
      assert(loadResult.isSuccess());
      const schemaId = loadResult.castValue<number>();
      assert(typeof schemaId === 'number');

      // Create a template for endpoint 'work' (operationId present in testApiSchema.json)
      const templateEndpointName = '/api/offer/create';
      const endpointToRun = 'work';
      const templateName = 'bench_template';
      const templateResult = await templateFillingService.createEndpointTemplate({
        schemaId: schemaId!,
        endpointName: templateEndpointName,
        templateName,
      });
      assert(templateResult.isSuccess());
      // Verify stored file structure
      const templateFilling = templateResult.castValueStrict<any>();
      const templatePath = templateFilling.filePath();
      console.info('TemplateFilling.schemaId:', templateFilling.schemaId, 'name:', templateFilling.name);
      let parsedTemplate: any = null;
      try {
        const rawTemplate = await Deno.readTextFile(templatePath);
        parsedTemplate = JSON.parse(rawTemplate);
      } catch (e) {
        console.info('Template path does not exist or cannot be read:', templatePath, e);
      }
      // Ensure all expected props exist (use the parsed template read from actual file path)
      assert(parsedTemplate && parsedTemplate.name);
      assert(parsedTemplate && parsedTemplate.schemaId !== undefined);
      assert(parsedTemplate && parsedTemplate.endpointName);
      // params key should exist and be an array
      assert(parsedTemplate && Array.isArray(parsedTemplate.params));

      // templateFilling already obtained above and templatePath is available
      // Quick debug: inspect the saved template content on disk
      console.info('Saved template path: ', templatePath);
      const dirPath = `volume/fillings`;
      console.info('Listing all entries under volume/fillings:');
      try {
        for await (const entry of Deno.readDir(dirPath)) {
          console.info('entry:', entry.name);
          const subPath = `${dirPath}/${entry.name}`;
          try {
            for await (const sub of Deno.readDir(subPath)) {
              console.info('  sub:', sub.name);
            }
          } catch (_e) {
            console.info('  could not read', subPath);
          }
        }
      } catch (e) {
        console.info('Could not list dir:', e);
      }
      console.info('Listing template dir:', dirPath);
      try {
        for await (const entry of Deno.readDir(dirPath)) {
          console.info('entry:', entry.name);
        }
      } catch (e) {
        console.info('Could not list dir:', e);
      }
      try {
        const loggedTemplateRaw = await Deno.readTextFile(templatePath);
        console.info('Template raw JSON:', loggedTemplateRaw);
      } catch (e) {
        console.info('Template path does not exist or cannot be read:', templatePath, e);
      }

      // Now benchmark with increasing number of requests
      const sizes = [10, 50, 100, 200];
      const concurrency = 4; // 4 threads
      const delayMs = 0;

      for (const size of sizes) {
        const start = performance.now();
        const runResult = await testService.runEndpoint({
          schema: schemaId!,
          endpoint: endpointToRun,
          template: '',
          numberOfRequests: size,
          concurrency,
          delayMs,
          mode: 'multiple',
        });
        const end = performance.now();
        if (!runResult.isSuccess()) {
          console.error('RunResult failed for size:', size, 'error:', runResult.errorMessage);
        }
        assert(runResult.isSuccess());
        console.info(`Benchmark: size=${size}, concurrency=${concurrency}, timeMs=${Math.round(end - start)}`);
      }
    } finally {
      globalThis.fetch = originalFetch;
      await prisma.$disconnect();
    }
  },
});
