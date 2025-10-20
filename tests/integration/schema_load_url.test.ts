import { load } from "@std/dotenv";
import { assert, assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { PrismaClient } from "../../prisma/generated/client.ts";
import { DependencyContainer } from "../../src/infrastructure/dependencyContainer.ts";
import { DependencyRegistration } from "../../src/infrastructure/dependencyRegistration.ts";
import { SchemaService } from "../../src/services/schemaService.ts";

await load({ envPath: "./.env.test", export: true });

describe("Schema Load from URL Integration Test", () => {
  let container: DependencyContainer;
  let schemaService: SchemaService;
  let prisma: PrismaClient;
  let mockServerController: AbortController;
  const MOCK_SERVER_PORT = 8081;
  const MOCK_SCHEMA_URL = `http://localhost:${MOCK_SERVER_PORT}/schema.json`;

  beforeAll(async () => {
    mockServerController = new AbortController();
    const mockSchemaContent = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Mock API", version: "1.0.0" },
      paths: {},
    });

    Deno.serve(
      {
        port: MOCK_SERVER_PORT,
        signal: mockServerController.signal,
        onListen: ({ hostname, port }) => {
          console.log(`Mock server running at http://${hostname}:${port}/`);
        },
      },
      () => new Response(mockSchemaContent, { headers: { "Content-Type": "application/json" } })
    );

    const dbPush = new Deno.Command("deno", {
      args: ["run", "-A", "npm:prisma", "db", "push", "--force-reset"],
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();
    await dbPush.status;

    container = new DependencyContainer();
    const registrator = new DependencyRegistration(container);
    await registrator.registerAll();

    schemaService = container.resolve<SchemaService>("SchemaService");
    prisma = container.resolve<PrismaClient>("PrismaClient");
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    mockServerController?.abort();
    try {
      await Deno.remove("./prisma/test.db");
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        console.error("Failed to delete test database:", error);
      }
    }
  });

  it("should import a schema from a URL and save it to the database", async () => {
    const schemaName = "My URL Schema";
    const groupName = "URL Imports";

    const result = await schemaService.loadSchema({
      url: MOCK_SCHEMA_URL,
      name: schemaName,
      group: groupName,
    });

    assert(result.isSuccess, "The loadSchema operation should succeed.");
    assertExists(result.value);

    const savedSchema = await prisma.schema.findUnique({
      where: { id: result.value.id },
      include: { Group: true },
    });

    assertExists(savedSchema, "Schema should be found in the database.");
    assertEquals(savedSchema.name, schemaName);
    assertEquals(savedSchema.sourceType, "URL");
    assertEquals(savedSchema.source, MOCK_SCHEMA_URL);
    assertExists(savedSchema.Group, "Schema should be assigned to a group.");
    assertEquals(savedSchema.Group.name, groupName);
  });
});