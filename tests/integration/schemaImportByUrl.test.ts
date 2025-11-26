import { assert, assertEquals } from '@std/assert';
import { ensureDir } from '@std/fs';
import { join, dirname, fromFileUrl } from '@std/path';

import { DependencyContainer } from '../../src/infrastructure/dependencyContainer.ts';
import { DependencyRegistration } from '../../src/infrastructure/dependencyRegistration.ts';

import { SchemaService } from '../../src/services/schemaService.ts';
import { SchemaRepository } from '../../src/repositories/schemaRepo.ts';
import { EndpointMetaDataRepository } from '../../src/repositories/enpointMetaDataRepository.ts';
import { EndpointRepository } from '../../src/repositories/endpointRepository.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';

const __dirname = dirname(fromFileUrl(import.meta.url));
const projectRoot = join(__dirname, '../../');

const prismaSchemaPath = join(projectRoot, 'prisma', 'schema.prisma');
const volumePath = join(projectRoot, 'volume');
const testDbRelative = join('volume', 'apilens.test.db');
const testDbFile = join(projectRoot, testDbRelative);

const schemaLocationPath = join(projectRoot, 'volume', 'test-schemas');
const testApiSchemaPath = join(
  projectRoot,
  'tests',
  'content',
  'testApiSchema.json',
);

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
  name: 'imports an OpenAPI schema from URL and stores it using Prisma and the file system',
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
    const schemaRepo = container.resolve<SchemaRepository>('SchemaRepository');
    const endpointMetaRepo = container.resolve<EndpointMetaDataRepository>(
      'EndpointMetaDataRepository',
    );
    const endpointRepo =
      container.resolve<EndpointRepository>('EndpointRepository');
    const prisma = container.resolve<PrismaClient>('PrismaClient');

    const testGroup = await prisma.group.create({
      data: {
        name: 'Test Group',
        color: '#ffffff',
      },
    });
    const groupRef = testGroup.id.toString();

    const fakeUrl = 'https://example.com/funday-openapi.json';
    const schemaJsonText = await Deno.readTextFile(testApiSchemaPath);

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: Request | URL | string) => {
      const url = input instanceof Request ? input.url : input.toString();
      assertEquals(url, fakeUrl);

      return new Response(schemaJsonText, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof globalThis.fetch;

    try {
      const result = await schemaService.loadSchema({
        url: fakeUrl,
        file: undefined,
        name: 'FunDay URL Schema (prisma integration)',
        group: groupRef,
      });

      assert(result.isSuccess());
      const schemaId = result.castValue<number>();
      assert(typeof schemaId === 'number');

      const savedSchema = await schemaRepo.getById(schemaId!);
      assert(savedSchema);
      assertEquals(savedSchema?.url, fakeUrl);
      assertEquals(savedSchema?.name, 'FunDay URL Schema (prisma integration)');
      assertEquals(savedSchema?.groupId, testGroup.id);

      const metaPaged = await endpointMetaRepo.listBySchemaId(
        schemaId!,
        1000,
        0,
      );
      assert(metaPaged.items.length > 0);

      const endpointsDir = join(
        volumePath,
        'schemas',
        schemaId!.toString(),
        'endpoints',
      );
      const endpointFiles: string[] = [];

      try {
        for await (const entry of Deno.readDir(endpointsDir)) {
          if (entry.isFile && entry.name.endsWith('.json')) {
            endpointFiles.push(entry.name);
          }
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          assert(false, 'Endpoints directory was not created on disk');
        } else {
          throw error;
        }
      }

      assert(
        endpointFiles.length > 0,
        'No endpoint JSON files were created on disk',
      );
    } finally {
      globalThis.fetch = originalFetch;
      await prisma.$disconnect();
      // try { await Deno.remove(testDbFile); } catch (_) {}
      // try { await Deno.remove(schemaLocationPath, { recursive: true }); } catch (_) {}
    }
  },
});
