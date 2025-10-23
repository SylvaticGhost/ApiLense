import { assertEquals } from '@std/assert';
import { parseApiSchemaFromFile } from '../src/mapper/schemaParser.ts';
import { ApiSchema } from '../src/core/apiSchema.ts';
import { HTTP_METHODS } from '../src/core/enums.ts';

Deno.test(
  'parseApiSchemaFromFile parses full FunDay OpenAPI schema correctly',
  async () => {
    const schema = ApiSchema.createByFile(
      1,
      'FunDay Test Schema',
      undefined,
      './tests/content/testApiSchema.json',
    );

    const endpoints = await parseApiSchemaFromFile(schema);

    assertEquals(endpoints.length > 0, true);

    const work = endpoints.find((e) => e.path === '/api/work');
    const apply = endpoints.find(
      (e) => e.path === '/api/application/{offerId}/apply',
    );
    const uploadAvatar = endpoints.find(
      (e) => e.path === '/api/user/avatar/upload',
    );
    const offerCreate = endpoints.find((e) => e.path === '/api/offer/create');

    assertEquals(work?.method, HTTP_METHODS.GET);
    assertEquals(work?.name, 'work');
    assertEquals(work?.template.params.length, 0);

    assertEquals(apply?.method, HTTP_METHODS.POST);
    assertEquals(apply?.template.params.length, 1);
    assertEquals(apply?.template.params[0].name, 'offerId');
    assertEquals(apply?.template.params[0].type, 'string');
    assertEquals(apply?.template.params[0].required, true);

    assertEquals(uploadAvatar?.method, HTTP_METHODS.POST);

    assertEquals(offerCreate?.method, HTTP_METHODS.POST);

    console.log(
      `Parsed ${endpoints.length} endpoints. Example:\n`,
      JSON.stringify(offerCreate, null, 2),
    );
  },
);
