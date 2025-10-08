import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';

export class GroupCommandDispatcher implements IDispatcher {
  constructor(
    private readonly command: Command,
    private readonly dependencyContainer: DependencyContainer,
  ) {}

  registerCommands(): void {
    this.command
      .command('group', 'Manage schema groups')
      .alias('g')
      .action(() => {
        console.log('Managing schema groups...');
      })
      .command('group-delete', 'Delete a schema group')
      .alias('gd')
      .option('-n, --name <name:string>', 'Name of the group to delete')
      .action((options) => {
        console.log('Deleting schema group...');
        console.log('Options:', options);
      })
      .command('group-create', 'Create a new schema group')
      .alias('gc')
      .option('-n, --name <name:string>', 'Name of the group to create')
      .option('-c, --color <color:string>', 'Color of the group')
      .action((options) => {
        console.log('Creating schema group...');
        console.log('Options:', options);
      })
      .command('group-remove', 'Remove a schema from a group')
      .alias('gr')
      .option(
        '-n, --name <name:string>',
        'Name of the group to remove the schema from',
      );
  }
}
