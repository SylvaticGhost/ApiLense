import { Result } from './result.ts';

export class TypedResult<T> {
  public statusCode: number;
  public errorMessage?: string;
  public value?: T;
  public warningMessage?: string[];

  constructor(
    statusCode: number,
    errorMessage?: string,
    warningMessages?: string[],
    value: T | null = null,
  ) {
    this.statusCode = statusCode;
    this.errorMessage = errorMessage;
    this.value = value === null ? undefined : value;
    this.warningMessage = warningMessages;
  }

  isSuccess(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  isFailure(): boolean {
    return !this.isSuccess();
  }

  hasValue(): boolean {
    return this.value !== undefined;
  }

  toUntyped(): Result {
    return new Result(
      this.statusCode,
      this.errorMessage,
      this.warningMessage,
      this.value,
    );
  }

  static success<T>(
    value: T | null = null,
    statusCode: number = 200,
    warnings: string[] = [],
  ): TypedResult<T> {
    return new TypedResult<T>(statusCode, '', warnings, value);
  }

  static failure<T>(
    errorMessage?: string,
    statusCode: number = 500,
  ): TypedResult<T> {
    return new TypedResult<T>(statusCode, errorMessage);
  }

  static badRequest<T>(errorMessage?: string): TypedResult<T> {
    return TypedResult.failure<T>(errorMessage, 400);
  }

  static notFound<T>(errorMessage?: string): TypedResult<T> {
    return TypedResult.failure<T>(errorMessage, 404);
  }
}
