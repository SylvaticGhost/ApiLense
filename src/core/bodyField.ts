import { BODY_FIELD_TYPES, type BodyFieldType } from './constants.ts';

export type BodyFieldValueKind = 'object' | 'array';

export class BodyField {
  name: string;
  typing: BodyFieldType;
  valueKind: BodyFieldValueKind;
  nestedFields: BodyField[];

  constructor(
    name: string,
    typing: BodyFieldType,
    valueKind: BodyFieldValueKind = 'object',
    nestedFields: BodyField[] = [],
  ) {
    this.name = name;
    this.typing = typing;
    this.valueKind = valueKind;
    this.nestedFields = nestedFields;
  }

  static createFromJson(name: string, raw: any): BodyField {
    if (typeof raw === 'object' && raw !== null) {
      const isArray = Array.isArray(raw);
      const nestedEntries = isArray ? raw[0] : raw;
      const nested: BodyField[] = Object.entries(nestedEntries || {}).map(
        ([key, val]) => BodyField.createFromJson(key, val),
      );
      return new BodyField(
        name,
        BODY_FIELD_TYPES.OBJECT,
        isArray ? 'array' : 'object',
        nested,
      );
    }

    const normalized = String(raw).toLowerCase();
    const typeMap: Record<string, BodyFieldType> = {
      int: BODY_FIELD_TYPES.INT,
      float: BODY_FIELD_TYPES.FLOAT,
      datetime: BODY_FIELD_TYPES.DATETIME,
      string: BODY_FIELD_TYPES.STRING,
      object: BODY_FIELD_TYPES.OBJECT,
    };
    const typing = typeMap[normalized] ?? BODY_FIELD_TYPES.STRING;

    return new BodyField(name, typing, 'object', []);
  }
}
