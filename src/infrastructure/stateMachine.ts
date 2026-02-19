export class StateMachine<T extends string | number | symbol> {
  private _currentState: T;

  constructor(initialState: T) {
    this._currentState = initialState;
  }

  get current(): T {
    return this._currentState;
  }

  is(state: T): boolean {
    return this._currentState === state;
  }

  to(state: T): void {
    this._currentState = state;
  }
}
