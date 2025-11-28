import { Command } from '@cliffy/command';
import { HelpCommand } from '@cliffy/command/help';
import { DependencyContainer } from './infrastructure/dependencyContainer.ts';
import { DependencyRegistration } from './infrastructure/dependencyRegistration.ts';
import { MainDispatcher } from './infrastructure/mainDispatcher.ts';
import { SchemaCommandDispatcher } from './cli/commands/schemaCommandDispatcher.ts';
import { GroupCommandDispatcher } from './cli/commands/groupCommandDispatcher.ts';
import { TemplateFillingDispatcher } from './cli/commands/templateFillingDispatcher.ts';
import { TestCommandDispatcher } from './cli/commands/testCommandDispatcher.ts';

const container = new DependencyContainer();
const registrator = new DependencyRegistration(container);
await registrator.registerAll();

await new MainDispatcher(new Command(), container)
  .config((cmd) => {
    cmd
      .name('ApiLens')
      .version('0.1.0')
      .description('Web API performance testing tool')
      .command('help', new HelpCommand().global())
      .default('help');
  })
  .add(
    (command, depContainer) =>
      new SchemaCommandDispatcher(command, depContainer),
  )
  .add(
    (command, depContainer) =>
      new GroupCommandDispatcher(command, depContainer),
  )
  .add(
    (command, depContainer) =>
      new TemplateFillingDispatcher(command, depContainer),
  )
  .add(
    (command, depContainer) => new TestCommandDispatcher(command, depContainer),
  )
  .registerCommands()
  .run(Deno.args);
