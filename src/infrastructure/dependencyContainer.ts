import {PrismaClient} from "../../prisma/generated/client.ts";

export interface DependencyProvider {
  resolve<TInstance>(name: string) : TInstance;
}

export class DependencyContainer implements DependencyProvider {
  constructor() {}

  private _map = new Map<string, any>();

  resolve<TInstance>(name: string) : TInstance {
    const instance = this._map.get(name);
    if (!instance) {
      throw new Error(`Dependency not found: ${name}`);
    }
    return instance as TInstance;
  }

  register<TInstance>(func: (container: DependencyContainer) => TInstance, name: string) {
    const instance = func(this);
    this._map.set(name, instance);
  }

  registerDbRepo<TRepository>(func: (prismaClient: PrismaClient) => TRepository, name: string) {
    const prismaClient = this.resolve<PrismaClient>('PrismaClient');
    const instance = func(prismaClient);
    this._map.set(name, instance);
  }

  async registerAsync<TInstance>(func: (container: DependencyContainer) => Promise<TInstance>, name: string) : Promise<void> {
    const instance = await func(this);
    this._map.set(name, instance);
  }
}
