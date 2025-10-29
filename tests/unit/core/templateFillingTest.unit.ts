import { ApiSchema } from '../../../src/core/apiSchema.ts';
import { Endpoint } from '../../../src/core/endpoint.ts';
import { parseApiSchemaFromFile } from '../../../src/mapper/schemaParser.ts';

const schema = ApiSchema.createByFile(
  1,
  'FunDay Test Schema',
  undefined,
  './tests/content/testApiSchema.json',
);

const endpoints: Endpoint[] = parseApiSchemaFromFile(schema).then();

Deno.test(() => {});
