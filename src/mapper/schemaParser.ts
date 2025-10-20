import { Endpoint } from '../core/endpoint.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { BodyField } from '../core/bodyField.ts';
import { BODY_FIELD_TYPES } from '../core/enums.ts';

function extractBodyFields(
  schema: any,
  schemasMap: Record<string, any>,
  depth = 0,
): BodyField[] {
  if (!schema || depth > 15) return [];

  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '');
    const resolved = schemasMap[ref];
    if (!resolved) return [];
    return extractBodyFields(resolved, schemasMap, depth + 1);
  }

  if (schema.type === 'object' && schema.properties) {
    return Object.entries(schema.properties).map(
      ([name, prop]: [string, any]) => {
        const nested = extractBodyFields(prop, schemasMap, depth + 1);
        const valueKind: 'object' | 'array' =
          prop.type === 'array' ? 'array' : 'object';
        const type = (prop.type as string)?.toLowerCase?.() ?? 'object';
        return new BodyField(name, type as any, valueKind, nested);
      },
    );
  }

  if (schema.type === 'array' && schema.items) {
    const nested = extractBodyFields(schema.items, schemasMap, depth + 1);
    return [new BodyField('items', 'object', 'array', nested)];
  }

  const type =
    (schema.type as string)?.toLowerCase?.() ?? BODY_FIELD_TYPES.STRING;
  return [new BodyField('value', type as any, 'object', [])];
}

export function openApiToSimpleSchema(openApi: any) {
  const endpoints: any[] = [];
  const schemasMap = openApi.components?.schemas ?? {};

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

      let bodyFields: BodyField[] = [];
      const bodySchema =
        def.requestBody?.content?.['application/json']?.schema ??
        def.requestBody?.content?.['multipart/form-data']?.schema;

      if (bodySchema) {
        bodyFields = extractBodyFields(bodySchema, schemasMap);
      }

      const name = def.operationId ?? `${method.toUpperCase()} ${path}`;

      endpoints.push({
        name,
        method: method.toUpperCase(),
        url: path,
        params,
        bodyFields,
      });
    }
  }

  return { endpoints };
}

export async function parseApiSchemaFromText(
  jsonText: string,
): Promise<Endpoint[]> {
  let data: any;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Invalid JSON in schema: ${(e as Error).message}`);
  }

  if (data.openapi && data.paths) {
    data = openApiToSimpleSchema(data);
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
