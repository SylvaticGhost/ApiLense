export class Result {
  public statusCode: number;
  public errorMessage?: string;
  public value?: any;
  public warningMessage?: string[];

  constructor(
    statusCode: number,
    errorMessage?: string,
    warningMessages?: string[],
    value: any = null,
  ) {
    this.statusCode = statusCode;
    this.errorMessage = errorMessage;
    this.value = value;
    this.warningMessage = warningMessages;
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

  castValueStrict<T>(): T {
    const val = this.castValue<T>();
    if (val === null) {
      throw new Error('Result has no value to cast');
    }
    return val;
  }

  valueOf(): boolean {
    return this.isSuccess();
  }

  json(): string {
    return JSON.stringify({
      statusCode: this.statusCode,
      errorMessage: this.errorMessage,
      value: this.value,
      warningMessage: this.warningMessage,
    });
  }

  public static success(
    value: any = null,
    statusCode: number = 200,
    warnings: string[] = [],
  ): Result {
    return new Result(statusCode, '', warnings, value);
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

  public static notFound(errorMessage?: string): Result {
    return new Result(404, errorMessage);
  }

  static newBuilder() {
    return new ResultBuilder();
  }
}

class ResultBuilder {
  private statusCode?: number;
  private errorMessage?: string;
  private value?: any;
  private warnings: string[] = [];

  withWarning(warning: string) {
    this.warnings.push(warning);
    return this;
  }

  success(value?: any, statusCode: number = 200) {
    this.statusCode = statusCode;
    this.value = value;
    return this.build();
  }

  badRequest(error?: string) {
    return this.error(400, error);
  }

  notFound(error?: string) {
    return this.error(404, error);
  }

  private error(code: number, error?: string) {
    this.statusCode = code;
    this.errorMessage = error;
    return this.build();
  }

  private build() {
    if (!this.statusCode) throw new Error("Code of result isn't set");

    return new Result(
      this.statusCode,
      this.errorMessage,
      this.warnings,
      this.value,
    );
  }
}
