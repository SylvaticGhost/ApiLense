import { strictGet } from '../utils/propUtils.ts';
import { BodyField } from './bodyField.ts';
import { Endpoint } from './endpoint.ts';
import { HttpMethod } from './enums.ts';
import { EndpointParam, Template } from './template.ts';

export class ParamFilling {
  name: string;
  value: string;

  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }

  static createFromParam(param: EndpointParam) {
    let placeholderValue = `[${param.type}]-<${param.name}>`;
    if (param.description) placeholderValue += `-[${param.description}]`;
    return new ParamFilling(param.name, placeholderValue);
  }
}

function defaultForPrimitive(typing?: string) {
  const t = (typing ?? '').toLowerCase();
  if (t === 'integer' || t === 'int' || t === 'int32' || t === 'int64')
    return 0;
  if (t === 'number' || t === 'float' || t === 'double') return 0;
  if (t === 'boolean') return false;
  if (
    t === 'datetime' ||
    t === 'date-time' ||
    t === 'datetimeoffset' ||
    t === 'date'
  )
    return new Date().toISOString();
  return '';
}

class BodyFilling {
  content: object;

  private constructor(content: object) {
    this.content = content;
  }

  static createFromSchema(fields: BodyField[]): BodyFilling | null {
    if (!fields || fields.length === 0) return null;

    function build(fields: BodyField[] = [], depth = 0): object {
      const result: { [k: string]: unknown } = {};
      if (!fields || depth > 15) return result;

      for (const f of fields) {
        const name = f.name ?? '';
        const kind = (f.valueKind ?? '').toLowerCase();
        const typing = f.typing;

        if (kind === 'array') {
          if (Array.isArray(f.nestedFields) && f.nestedFields.length > 0) {
            result[name] = [build(f.nestedFields, depth + 1)];
          } else {
            result[name] = [defaultForPrimitive(typing)];
          }
          continue;
        }

        if (
          (kind === 'object' || typing === 'object') &&
          Array.isArray(f.nestedFields) &&
          f.nestedFields.length > 0
        ) {
          result[name] = build(f.nestedFields, depth + 1);
          continue;
        }

        result[name] = defaultForPrimitive(typing);
      }

      return result;
    }

    const content = build(fields);
    return new BodyFilling(content);
  }
}

export class TemplateFilling {
  name: string;
  schemaId: number;
  endpointName: string;
  endpointPath: string;
  method: HttpMethod;

  params: ParamFilling[];
  bodyFilling: object | null;

  private constructor(
    name: string,
    schemaId: number,
    endpointName: string,
    endpointPath: string,
    method: HttpMethod,
    params: ParamFilling[],
    bodyFilling: object | null,
  ) {
    this.name = name;
    this.schemaId = schemaId;
    this.endpointName = endpointName;
    this.endpointPath = endpointPath;
    this.method = method;
    this.params = params;
    this.bodyFilling = bodyFilling;
  }

  updateName(newName: string) {
    this.name = newName;
  }

  bodyAsString(): string {
    return this.bodyFilling ? JSON.stringify(this.bodyFilling, null, 2) : '';
  }

  getParamValue(paramName: string): string | null {
    const param = this.params.find((p) => p.name === paramName);
    return param ? param.value : null;
  }

  static create(
    name: string,
    schemaId: number,
    endpoint: Endpoint,
    template: Template,
  ) {
    const paramsFilling = template.params.map((param) =>
      ParamFilling.createFromParam(param),
    );
    const bodyFillingContent = BodyFilling.createFromSchema(
      template.bodyFields,
    );

    return new TemplateFilling(
      name,
      schemaId,
      endpoint.name,
      endpoint.path,
      endpoint.method,
      paramsFilling,
      bodyFillingContent ? bodyFillingContent.content : null,
    );
  }

  static fromJson(data: string): TemplateFilling {
    const obj = JSON.parse(data);
    const name = strictGet(obj, (o) => o.name);
    const schemaId = strictGet(obj, (o) => o.schemaId);
    const endpointName = strictGet(obj, (o) => o.endpointName);
    const endpointPath = strictGet(obj, (o) => o.endpointPath);
    const method = strictGet(obj, (o) => o.method);
    const params = strictGet(obj, (o) => o.params);
    const body = strictGet(obj, (o) => o.bodyFilling);
    return new TemplateFilling(
      name,
      schemaId,
      endpointName,
      endpointPath,
      method,
      params.map(
        (p: any) =>
          new ParamFilling(
            strictGet(p, (p) => p.name),
            strictGet(p, (p) => p.value),
          ),
      ),
      body && typeof body === 'object' ? body : null,
    );
  }

  /** @returns file path where this filling is should be stored */
  filePath(): string {
    return TemplateFilling.filePath(
      this.schemaId,
      this.endpointName,
      this.name,
    );
  }

  static filePath(
    schemaId: number,
    endpointName: string,
    templateName: string,
  ) {
    return `volume/fillings/${schemaId}/${endpointName.replace(/\//g, '_')}/${templateName}.json`;
  }

  stringify(): string {
    return JSON.stringify(
      {
        name: this.name,
        endpointName: this.endpointName,
        endpointPath: this.endpointPath,
        method: this.method,
        params: this.params.map((p) => ({ name: p.name, value: p.value })),
        body: this.bodyFilling,
      },
      null,
      2,
    );
  }

  static parse(data: any): TemplateFilling {
    const name = String(data.name ?? 'UnnamedTemplateFilling');
    const schemaId = Number(data.schemaId ?? 0);
    const endpointName = String(data.endpointName ?? 'UnnamedEndpoint');
    const endpointPath = String(data.endpointPath ?? '/unknown/path');
    const methodStr = String(data.method ?? 'GET').toUpperCase();
    const allowedMethods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
      'HEAD',
      'TRACE',
    ];
    const method = (
      allowedMethods.includes(methodStr) ? methodStr : 'GET'
    ) as HttpMethod;
    const paramsData = Array.isArray(data.params) ? data.params : [];
    const params = paramsData.map(
      (p: any) =>
        new ParamFilling(String(p.name ?? 'param'), String(p.value ?? '')),
    );
    const bodyFilling =
      data.body && typeof data.body === 'object' ? data.body : null;
    return new TemplateFilling(
      name,
      schemaId,
      endpointName,
      endpointPath,
      method,
      params,
      bodyFilling,
    );
  }
}
