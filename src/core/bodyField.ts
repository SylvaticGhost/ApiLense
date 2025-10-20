import {
  BODY_FIELD_TYPES,
  BODY_FIELD_TYPE_MAP,
  type BodyFieldType,
} from './enums.ts';

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
    const typing = BODY_FIELD_TYPE_MAP[normalized] ?? BODY_FIELD_TYPES.STRING;

    return new BodyField(name, typing, 'object', []);
  }
}
