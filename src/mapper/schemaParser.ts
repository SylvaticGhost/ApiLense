import { Endpoint } from '../core/endpoint.ts';
import { ApiSchema } from '../core/apiSchema.ts';

export async function parseApiSchemaFromText(
  jsonText: string,
): Promise<Endpoint[]> {
  let data: any;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Invalid JSON in schema: ${(e as Error).message}`);
  }

  if (!data.endpoints || !Array.isArray(data.endpoints)) {
    throw new Error('Invalid schema format: "endpoints" array is missing');
  }

  return data.endpoints.map((endpointJson: any) =>
    Endpoint.createFromJson(endpointJson),
  );
}

export async function parseApiSchemaFromFile(
  schema: ApiSchema,
): Promise<Endpoint[]> {
  if (!schema.filePath) throw new Error('Schema filePath is required');
  const raw = await Deno.readTextFile(schema.filePath);
  return parseApiSchemaFromText(raw);
}
