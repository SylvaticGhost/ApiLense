import { Result } from '../../utils/result.ts';
import { TypedResult } from '../../utils/typedResult.ts';

export abstract class BaseValidator<
  T,
  TValidator extends BaseValidator<T, TValidator>,
> {
  protected result?: Result;
  protected val: T | undefined;

  abstract fromAnyToType(field: any, fieldName?: string): TypedResult<T>;
  abstract selfReturn(): TValidator;

  constructor(
    field: any,
    protected readonly fieldName?: string,
  ) {
    const convertResult = this.fromAnyToType(field, fieldName);
    if (convertResult.isFailure()) this.result = convertResult.toUntyped();
    else this.val = convertResult.value;
  }

  protected check(valFunction: (val: T) => Result | null): TValidator {
    if (!this.result) {
      const res = valFunction(this.val!);
      if (res && res.isFailure()) this.result = res;
    }

    return this.selfReturn();
  }

  getResult(): Result | undefined {
    return this.result;
  }

  getTypedResult(): TypedResult<T> {
    if (this.result) {
      return new TypedResult<T>(
        this.result.statusCode,
        this.result.errorMessage,
        this.result.warningMessage,
        undefined,
      );
    }
    return TypedResult.success<T>(this.val!);
  }
}
