import { Result } from '../../utils/result.ts';
import { TypedResult } from '../../utils/typedResult.ts';
import { BaseValidator } from './baseValidator.ts';

export class NumberValidator extends BaseValidator<number, NumberValidator> {
  override fromAnyToType(field: any, fieldName?: string): TypedResult<number> {
    if (typeof field !== 'number' || isNaN(field))
      return TypedResult.failure<number>(
        `Field ${fieldName ?? 'unknown'} is not a number`,
      );
    return TypedResult.success<number>(field);
  }

  override selfReturn(): NumberValidator {
    return this;
  }

  constructor(field: any, fieldName?: string) {
    super(field, fieldName);
  }

  isNatural(): NumberValidator {
    return this.check((val) => {
      if (!Number.isInteger(val) || val < 0) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is not a natural number`,
        );
      }
      return null;
    });
  }

  isInteger(): NumberValidator {
    if (this.result) {
      return this;
    }
    return this.check((val) => {
      if (!Number.isInteger(val)) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is not an integer`,
        );
      }
      return null;
    });
  }

  isPositive(): NumberValidator {
    return this.check((val) => {
      if (val <= 0) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is not positive`,
        );
      }
      return null;
    });
  }

  isNonNegative(): NumberValidator {
    return this.check((val) => {
      if (val < 0) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is negative`,
        );
      }
      return null;
    });
  }

  isNonZero(): NumberValidator {
    return this.check((val) => {
      if (val === 0) {
        return Result.failure(`Field ${this.fieldName ?? 'unknown'} is zero`);
      }
      return null;
    });
  }

  min(minValue: number): NumberValidator {
    return this.check((val) => {
      if (val < minValue) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is less than ${minValue}`,
        );
      }
      return null;
    });
  }

  max(maxValue: number): NumberValidator {
    return this.check((val) => {
      if (val > maxValue) {
        return Result.failure(
          `Field ${this.fieldName ?? 'unknown'} is greater than ${maxValue}`,
        );
      }
      return null;
    });
  }
}
