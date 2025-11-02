import { Command } from '@cliffy/command';
import { DependencyContainer } from './dependencyContainer.ts';
export interface IDispatcher {
  registerCommands(): void;
}

export class MainDispatcher implements IDispatcher {
  constructor(
    private readonly command: Command,
    private readonly dependencyContainer: DependencyContainer,
  ) {}

  add(
    factory: (command: Command, container: DependencyContainer) => IDispatcher,
  ): MainDispatcher {
    this.dispatchers.push(factory(this.command, this.dependencyContainer));
    return this;
  }

  private readonly dispatchers: IDispatcher[] = [];

  registerCommands(): MainDispatcher {
    for (const dispatcher of this.dispatchers) dispatcher.registerCommands();
    return this;
  }

  config(func: (command: Command) => void): MainDispatcher {
    func(this.command);
    return this;
  }

  async run(args: string[] | undefined): Promise<void> {
    await this.command.parse(args);
    Deno.exit();
  }
}
