import { assertEquals } from '@std/assert';
import { parseApiSchemaFromText } from '../src/mapper/schemaParser.ts';
import { HTTP_METHODS } from '../src/core/constants.ts';

const openApi = {
  openapi: '1.0.0',
  info: {
    title: 'Test Api',
    description: 'test',
    version: 'v1',
  },
  paths: {
    '/api/work': {
      get: {
        tags: ['App'],
        summary: 'Health check endpoint',
        description: 'For internal usage to check if the server is running',
        operationId: 'work',
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
  },
};

function openApiToSimpleSchema(openApi: any) {
  const endpoints: any[] = [];

  for (const [path, methods] of Object.entries(openApi.paths)) {
    for (const [method, def] of Object.entries(
      methods as Record<string, any>,
    )) {
      const params =
        def.parameters?.map((p: any) => ({
          name: p.name,
          type: p.schema?.type ?? 'string',
          required: !!p.required,
          description: p.description,
        })) ?? [];

      const name = def.operationId ?? `${method.toUpperCase()} ${path}`;

      endpoints.push({
        name,
        method: method.toUpperCase(),
        url: path,
        params,
      });
    }
  }

  return { endpoints };
}

Deno.test(
  'parseApiSchemaFromText parses embedded OpenAPI schema correctly',
  async () => {
    const schema = openApiToSimpleSchema(openApi);
    const endpoints = await parseApiSchemaFromText(JSON.stringify(schema));
    assertEquals(endpoints.length, 1);

    const e = endpoints[0];
    assertEquals(e.name, 'work');
    assertEquals(e.method, HTTP_METHODS.GET);
    assertEquals(e.path, '/api/work');
    assertEquals(e.template.params.length, 0);
  },
);
