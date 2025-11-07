import { Endpoint } from '../core/endpoint.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { BodyField } from '../core/bodyField.ts';
import { BODY_FIELD_TYPES } from '../core/enums.ts';

function mapOpenApiTypeToBodyType(type?: string, format?: string): string {
  const t = (type ?? '').toLowerCase();
  const f = (format ?? '').toLowerCase();
  if (t === 'integer' || t === 'int' || t === 'int32' || t === 'int64')
    return BODY_FIELD_TYPES.INT;
  if (t === 'number' || t === 'float' || t === 'double')
    return BODY_FIELD_TYPES.FLOAT;
  if (t === 'string' && (f === 'date-time' || f === 'datetime' || f === 'date'))
    return BODY_FIELD_TYPES.DATETIME;
  if (t === 'object') return BODY_FIELD_TYPES.OBJECT;
  return BODY_FIELD_TYPES.STRING;
}

function schemaToPlainBody(
  schema: any,
  schemasMap: Record<string, any>,
  depth = 0,
): any {
  if (!schema || depth > 15) return undefined;

  if (schema.$ref) {
    const ref = String(schema.$ref).replace('#/components/schemas/', '');
    const resolved = schemasMap[ref];
    if (!resolved) return undefined;
    return schemaToPlainBody(resolved, schemasMap, depth + 1);
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    let merged: any = {};
    for (const part of schema.allOf) {
      const body = schemaToPlainBody(part, schemasMap, depth + 1);
      if (Array.isArray(body)) {
        merged = body;
      } else if (typeof body === 'object' && body !== null) {
        merged = { ...(merged || {}), ...(body || {}) };
      }
    }
    return merged;
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const body = schemaToPlainBody(schema.oneOf[0], schemasMap, depth + 1);
    return body;
  }

  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const body = schemaToPlainBody(schema.anyOf[0], schemasMap, depth + 1);
    return body;
  }

  if (
    schema.type === 'object' ||
    schema.properties ||
    schema.additionalProperties
  ) {
    const result: Record<string, any> = {};
    if (schema.properties) {
      for (const [name, prop] of Object.entries(schema.properties)) {
        const plain = schemaToPlainBody(prop as any, schemasMap, depth + 1);
        if (plain === undefined) continue;
        result[name] = plain;
      }
    }
    if (schema.additionalProperties) {
      const ap = schemaToPlainBody(
        schema.additionalProperties,
        schemasMap,
        depth + 1,
      );
      if (ap !== undefined) {
        result['<key>'] = ap;
      }
    }
    return result;
  }

  if (schema.type === 'array' && schema.items) {
    const item = schemaToPlainBody(schema.items, schemasMap, depth + 1);
    if (item === undefined) return [];
    return [item];
  }

  const bodyType = mapOpenApiTypeToBodyType(schema.type, schema.format);
  return bodyType;
}

function extractBodyFields(
  schema: any,
  schemasMap: Record<string, any>,
  depth = 0,
): BodyField[] {
  const plain = schemaToPlainBody(schema, schemasMap, depth);
  if (plain === undefined) return [];
  if (Array.isArray(plain)) {
    const nested =
      Array.isArray(plain) && plain[0] && typeof plain[0] === 'object'
        ? Object.entries(plain[0]).map(([k, v]) =>
            BodyField.createFromJson(k, v),
          )
        : [];
    return [new BodyField('items', BODY_FIELD_TYPES.OBJECT, 'array', nested)];
  }
  if (typeof plain === 'object' && plain !== null) {
    return Object.entries(plain).map(([k, v]) =>
      BodyField.createFromJson(k, v),
    );
  }
  return [BodyField.createFromJson('value', plain)];
}

export function openApiToSimpleSchema(openApi: any) {
  const endpoints: any[] = [];
  const schemasMap = openApi.components?.schemas ?? {};

  for (const [path, methods] of Object.entries(openApi.paths)) {
    for (const [method, def] of Object.entries(
      methods as Record<string, any>,
    )) {
      console.info(`Processing endpoint:`, def);
      const params =
        def.parameters?.map((p: any) => ({
          name: p.name,
          type: p.schema?.type ?? 'string',
          required: !!p.required,
          description: p.description,
          paramType: p.in,
        })) ?? [];

      let body: any = undefined;

      if (def.requestBody) {
        let bodySchema = def.requestBody.schema ?? undefined;
        if (!bodySchema) {
          const content = def.requestBody.content ?? {};
          const possibleKeys = [
            'application/json',
            'text/json',
            'application/*+json',
            'multipart/form-data',
          ];
          for (const key of possibleKeys) {
            if (content[key]?.schema) {
              bodySchema = content[key].schema;
              break;
            }
          }
          if (!bodySchema) {
            const first = Object.values(content)[0] as any;
            if (first?.schema) bodySchema = first.schema;
          }
        }
        if (bodySchema) {
          body = schemaToPlainBody(bodySchema, schemasMap, 0);
        }
      }

      const responses: number[] = def.responses
        ? Object.keys(def.responses)
            .filter((k) => /^\d{3}$/.test(k))
            .map((k) => parseInt(k, 10))
        : [];

      const name = def.operationId ?? `${String(method).toUpperCase()} ${path}`;

      const endpointJson: any = {
        name,
        method: String(method).toUpperCase(),
        url: path,
        params,
        responses,
      };

      if (body !== undefined) {
        endpointJson.body = body;
      }

      endpoints.push(endpointJson);
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
