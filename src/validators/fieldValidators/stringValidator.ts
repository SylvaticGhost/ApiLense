import { Result } from '../../utils/result.ts';
import { TypedResult } from '../../utils/typedResult.ts';
import { BaseValidator } from './baseValidator.ts';

export class StringValidator extends BaseValidator<string, StringValidator> {
  override selfReturn(): StringValidator {
    return this;
  }

  override fromAnyToType(field: any, fieldName?: string): TypedResult<string> {
    if (typeof field !== 'string')
      return TypedResult.failure<string>(
        `Field ${fieldName ?? 'unknown'} is not a string`,
      );
    return TypedResult.success(field);
  }

  constructor(field: any, fieldName?: string) {
    super(field, fieldName);
  }

  isNotEmpty(): StringValidator {
    return this.check((val) => {
      if (val.length === 0) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} should not be empty`,
        );
      }
      return null;
    });
  }

  hasMaxLength(maxLength: number): StringValidator {
    return this.check((val) => {
      if (val.length > maxLength) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} exceeds maximum length of ${maxLength}`,
        );
      }
      return null;
    });
  }

  hasMinLength(minLength: number): StringValidator {
    return this.check((val) => {
      if (val.length < minLength) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is shorter than minimum length of ${minLength}`,
        );
      }
      return null;
    });
  }

  convertableToEnum(enumObject: any): StringValidator {
    return this.check((val) => {
      const upperStr = val.toUpperCase();
      const enumValues = Object.values(enumObject).map((v) =>
        v.toString().toUpperCase(),
      );
      if (!enumValues.includes(upperStr)) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} with value '${val}' is not a valid enum value`,
        );
      }
      return null;
    });
  }
}
