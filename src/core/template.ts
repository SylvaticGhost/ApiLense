import { BodyField, BodyFieldValueKind } from './bodyField.ts';
import { BODY_FIELD_TYPE_MAP, BODY_FIELD_TYPES, ParamType } from './enums.ts';
export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  paramType: ParamType;
}

interface RawBodyField {
  name: string;
  typing: string; // Will be mapped to BodyFieldType
  valueKind: BodyFieldValueKind;
  nestedFields: RawBodyField[];
}

export class Template {
  params: EndpointParam[];
  bodyFields: BodyField[];

  constructor(params: EndpointParam[], bodyFields: BodyField[]) {
    this.params = params;
    this.bodyFields = bodyFields;
  }

  static createFromJsonString(json: string): Template {
    const data = JSON.parse(json);
    return Template.createFromJson(data);
  }

  static createFromJson(data: any): Template {
    const params: EndpointParam[] = Template.parseEndpointParams(data);

    const bodyRaw = data.body && typeof data.body === 'object' ? data.body : {};
    const bodyFields: BodyField[] = Object.entries(bodyRaw).map(
      ([name, value]) => BodyField.createFromJson(name, value),
    );

    return new Template(params, bodyFields);
  }

  static createFromStoredJson(json: any): Template {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data) return new Template([], []);

    const params: EndpointParam[] = Template.parseEndpointParams(data);

    const bodyFields: BodyField[] = Array.isArray(data.bodyFields)
      ? data.bodyFields.map((rawField: RawBodyField) =>
          this.mapRawFieldToBodyField(rawField),
        )
      : [];

    return new Template(params, bodyFields);
  }

  private static parseEndpointParams(data: any): EndpointParam[] {
    return Array.isArray(data.params)
      ? data.params.map((p: any) => ({
          name: String(p.name),
          type: p.type ?? 'string',
          required: Boolean(p.required ?? false),
          description: p.description,
          paramType: String(p.paramType ?? p.in ?? 'query') as ParamType,
        }))
      : [];
  }

  private static mapRawFieldToBodyField(rawField: RawBodyField): BodyField {
    if (!rawField.nestedFields || rawField.nestedFields.length === 0) {
      const typing =
        BODY_FIELD_TYPE_MAP[rawField.typing.toLowerCase()] ??
        BODY_FIELD_TYPES.STRING;
      return new BodyField(rawField.name, typing, rawField.valueKind, []);
    }

    const nested: BodyField[] = rawField.nestedFields.map((nf) =>
      this.mapRawFieldToBodyField(nf),
    );

    const typing =
      BODY_FIELD_TYPE_MAP[rawField.typing.toLowerCase()] ??
      BODY_FIELD_TYPES.OBJECT;

    return new BodyField(rawField.name, typing, rawField.valueKind, nested);
  }
}
