import { Result } from '../utils/result.ts';

export class NumberValidator {
  private result?: Result;
  private val: number | undefined;

  constructor(
    field: any,
    private readonly fieldName?: string,
  ) {
    if (typeof field !== 'number') {
      this.result = Result.failure(
        `Field ${fieldName ?? 'unknown'} is not a number`,
      );
    }
    this.val = field;
  }

  isNatural(): NumberValidator {
    if (this.result) {
      return this;
    }
    if (!Number.isInteger(this.val) || this.val! < 0) {
      this.result = Result.failure(
        `Field ${this.fieldName ?? 'unknown'} is not a natural number`,
      );
    }
    return this;
  }

  isInteger(): NumberValidator {
    if (this.result) {
      return this;
    }
    if (!Number.isInteger(this.val)) {
      this.result = Result.failure(
        `Field ${this.fieldName ?? 'unknown'} is not an integer`,
      );
    }
    return this;
  }

  isPositive(): NumberValidator {
    if (this.result) {
      return this;
    }
    if (this.val! <= 0) {
      this.result = Result.failure(
        `Field ${this.fieldName ?? 'unknown'} is not positive`,
      );
    }
    return this;
  }

  isNonNegative(): NumberValidator {
    if (this.result) {
      return this;
    }
    if (this.val! < 0) {
      this.result = Result.failure(
        `Field ${this.fieldName ?? 'unknown'} is negative`,
      );
    }
    return this;
  }

  isNonZero(): NumberValidator {
    if (this.result) {
      return this;
    }
    if (this.val === 0) {
      this.result = Result.failure(
        `Field ${this.fieldName ?? 'unknown'} is zero`,
      );
    }
    return this;
  }

  getResult(): Result | undefined {
    return this.result;
  }
}
