export class Result {
  public statusCode: number;
  public errorMessage?: string;
  public value?: any;

  private constructor(
    statusCode: number,
    errorMessage?: string,
    value: any = null,
  ) {
    this.statusCode = statusCode;
    this.errorMessage = errorMessage;
    this.value = value;
  }

  isSuccess(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  isFailure(): boolean {
    return !this.isSuccess();
  }

  hasValue(): boolean {
    return this.value !== null && this.value !== undefined;
  }

  castValue<T>(): T | null {
    return this.hasValue() ? (this.value as T) : null;
  }

  valueOf(): boolean {
    return this.isSuccess();
  }

  public static success(value: any = null, statusCode: number = 200): Result {
    return new Result(statusCode, '', value);
  }

  public static failure(
    errorMessage?: string,
    statusCode: number = 500,
  ): Result {
    return new Result(statusCode, errorMessage);
  }

  public static badRequest(errorMessage?: string): Result {
    return new Result(400, errorMessage);
  }
}
