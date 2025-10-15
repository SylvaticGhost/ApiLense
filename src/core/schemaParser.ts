import { Endpoint } from './endpoint.ts';
import { ApiSchema } from './apiSchema.ts';

export async function parseApiSchemaFile(
  schema: ApiSchema,
): Promise<Endpoint[]> {
  if (!schema.filePath) {
    throw new Error('Schema filePath is required to parse endpoints');
  }

  const raw = await Deno.readTextFile(schema.filePath);
  const data = JSON.parse(raw);

  if (!data.endpoints || !Array.isArray(data.endpoints)) {
    throw new Error('Invalid schema format: "endpoints" array is missing');
  }

  return data.endpoints.map((endpointJson: any) =>
    Endpoint.createFromJson(endpointJson),
  );
}
