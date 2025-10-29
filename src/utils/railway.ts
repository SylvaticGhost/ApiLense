import { Result } from './result.ts';

export class Railway<TResult> {
  private result?: TResult;

  forkWith(result?: TResult): Railway<TResult> {
    this.result ??= result;
    return this;
  }

  fork(func: () => TResult): Railway<TResult> {
    this.result ??= func();
    return this;
  }

  getResultOrDefault(defaultValue?: TResult): TResult | undefined {
    return this.result ?? defaultValue;
  }

  getResult(): TResult {
    if (!this.result) throw new Error('No result available');
    return this.result;
  }
}

export class CompareRailway<T1, T2> extends Railway<Result> {
  private first: T1;
  private second: T2;

  constructor(first: T1, second: T2) {
    super();
    this.first = first;
    this.second = second;
  }

  forkCompare(
    func: (first: T1, second: T2) => boolean,
    result: Result,
  ): CompareRailway<T1, T2> {
    if (func(this.first, this.second)) this.forkWith(result);
    return this;
  }

  forkByFirst(
    func: (first: T1) => boolean,
    result: Result,
  ): CompareRailway<T1, T2> {
    if (func(this.first)) this.forkWith(result);
    return this;
  }

  forkBySecond(
    func: (second: T2) => boolean,
    result: Result,
  ): CompareRailway<T1, T2> {
    if (func(this.second)) this.forkWith(result);
    return this;
  }
}
