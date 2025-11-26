import { BODY_FIELD_TYPE_MAP, BodyFieldType } from '../core/enums.ts';

export class ValueValidator {
  static validate(
    value: string | null | undefined,
    type: BodyFieldType,
    allowNull: boolean = true,
  ): boolean {
    if (value === null || value === undefined) return allowNull;

    switch (type) {
      case BODY_FIELD_TYPE_MAP.string:
        return value !== null && value !== undefined;
      case BODY_FIELD_TYPE_MAP.int:
        return value !== null && value !== undefined;
      case BODY_FIELD_TYPE_MAP.integer:
        return value !== null && value !== undefined && this.isInteger(value);
      case BODY_FIELD_TYPE_MAP.number:
        return value !== null && value !== undefined && this.isNumber(value);
      case BODY_FIELD_TYPE_MAP.boolean:
        return value !== null && value !== undefined && this.isBoolean(value);
      case BODY_FIELD_TYPE_MAP.dateTime:
        return value !== null && value !== undefined && this.isDateTime(value);
      default:
        return false;
    }
  }

  private static isInteger(value: string): boolean {
    const n = Number(value);
    return Number.isInteger(n);
  }

  private static isNumber(value: string): boolean {
    const n = Number(value);
    return !isNaN(n);
  }

  private static isBoolean(value: string): boolean {
    const v = value.toLowerCase();
    return v === 'true' || v === 'false';
  }

  private static isDateTime(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}
