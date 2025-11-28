import { ApiSchema } from '../../src/core/apiSchema.ts';
import { parseApiSchemaFromFile } from '../../src/mapper/schemaParser.ts';

const schema = ApiSchema.createByFile(
  1,
  'FunDay Test Schema',
  undefined,
  './tests/content/testApiSchema.json',
);

Deno.bench('Schema Parser Benchmark', async () => {
  const endpoints = await parseApiSchemaFromFile(schema);
});
