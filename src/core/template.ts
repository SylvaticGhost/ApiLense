import { BodyField } from './bodyField.ts';
import { ParamType } from './enums.ts';
export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  paramType: ParamType;
}

export class Template {
  params: EndpointParam[];
  bodyFields: BodyField[];

  constructor(params: EndpointParam[], bodyFields: BodyField[]) {
    this.params = params;
    this.bodyFields = bodyFields;
  }

  static createFromJson(data: any): Template {
    const params: EndpointParam[] = Array.isArray(data.params)
      ? data.params.map((p: any) => ({
          name: String(p.name),
          type: p.type ?? 'string',
          required: Boolean(p.required ?? false),
          description: p.description,
          paramType: String(p.paramType ?? p.in ?? 'query') as ParamType,
        }))
      : [];

    const bodyRaw = data.body && typeof data.body === 'object' ? data.body : {};
    const bodyFields: BodyField[] = Object.entries(bodyRaw).map(
      ([name, value]) => BodyField.createFromJson(name, value),
    );

    return new Template(params, bodyFields);
  }
}
