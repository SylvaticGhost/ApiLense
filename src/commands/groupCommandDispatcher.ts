import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { GroupService } from '../services/groupService.ts';
import * as colors from '@std/fmt/colors';
import { Group } from '../core/group.ts';
import { Result } from '../utils/result.ts';

interface CreateGroupArgsPure {
  name?: string;
  color?: string;
}

interface CreateGroupArgs {
  name: string;
  color?: string;
}

export class GroupCommandDispatcher implements IDispatcher {
  private readonly groupService: GroupService;

  constructor(
    private readonly command: Command,
    private readonly dependencyContainer: DependencyContainer,
  ) {
    this.groupService = this.dependencyContainer.resolve<GroupService>(
      'GroupService',
    );
  }

  registerCommands(): void {
    this.command
      .command('group-create', 'Create a new schema group')
      .alias('gc')
      .option('-n, --name <name:string>', 'Name of the group to create')
      .option('-c, --color <color:string>', 'Color of the group')
      .action(
        async (options) =>
          await CommandLogic.define<
            CreateGroupArgsPure,
            CreateGroupArgs,
            Group
          >()
            .withValidation((argValidator) =>
              argValidator
                .for(
                  (a) => a.name,
                  (v) => v.defineName('name').notNull().hasType('string'),
                )
                .for(
                  (a) => a.color,
                  (v) => v.defineName('color').optional().hasType('string'),
                )
                .map((a) => {
                  return {
                    name: a.name!,
                    color: a.color,
                  } as CreateGroupArgs;
                })
            )
            .withLogic(async (input: CreateGroupArgs) => {
              return await this.groupService.createGroup(input);
            })
            .withResultDisplay((result: Result) => {
              if (result.isSuccess()) {
                console.log(
                  colors.green(
                    `✅ Групу "${options.name}" успішно створено.`,
                  ),
                );
              }
            })
            .execute(options),
      );

    this.command
      .command('group-delete', 'Delete a schema group')
      .alias('gd')
      .option('-n, --name <name:string>', 'Name of the group to delete')
      .action((options) => {
        console.log(colors.yellow('Deleting schema group... (не реалізовано)'));
        console.log('Options:', options);
      });

    this.command
      .command('group-remove-schema', 'Remove a schema from a group')
      .alias('gr')
      .option(
        '-n, --name <name:string>',
        'Name of the group to remove the schema from',
      )
      .action((options) => {
        console.log(
          colors.yellow(
            'Removing schema from group... (не реалізовано)',
          ),
        );
        console.log('Options:', options);
      });
  }
}