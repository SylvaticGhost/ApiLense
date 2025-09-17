export class DependencyContainer {
  constructor() {}

  private _map = new Map<string, any>();

  registerInstance<T>(key: string, instance: T): void {
    this._map.set(key, instance);
  }

  register<T, TInterface>() : void {

  }
}
