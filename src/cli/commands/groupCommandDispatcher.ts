import { Command } from '@cliffy/command';
import { DependencyContainer } from '../../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../../infrastructure/mainDispatcher.ts';
import { GroupService } from '../../services/groupService.ts';
import { SchemaService } from '../../services/schemaService.ts';
import { Select } from '@cliffy/prompt';
import { Table } from '@cliffy/table';
import { StringValidators } from '../../validators/stringValidators.ts';
import { NumberValidator } from '../../validators/fieldValidators/numberValidator.ts';
import NamedColorProvider from '../../infrastructure/providers/namedColorProvider.ts';
import { CommandLogic } from '../../infrastructure/commandLogic.ts';
import { PureArgs } from '../../contracts/commonArgs.ts';
import { Group } from '../../core/group.ts';
import { Result } from '../../utils/result.ts';
import { GroupTablePage } from '../outputs/groupTablePage.ts';
import { GroupListPrompts } from '../utils/groupListPromts.ts';
import { SmallSchemaTablePage } from '../outputs/smallSchemaTablePage.ts';

interface GroupCreatePureArgs extends PureArgs {
  name?: string | undefined;
  color?: string | undefined;
}

interface GroupUpdatePureArgs extends PureArgs {
  id?: number | undefined;
  name?: string | undefined;
  color?: string | undefined;
}

interface GroupDeletePureArgs extends PureArgs {
  id?: number | undefined;
  moveToDefault?: boolean | undefined;
}

interface GroupAddSchemaPureArgs extends PureArgs {
  schema?: number | undefined;
  group?: number | undefined;
}

interface GroupRemoveSchemaPureArgs extends PureArgs {
  schema?: number | undefined;
}

export class GroupCommandDispatcher implements IDispatcher {
  constructor(
    private readonly command: Command,
    private readonly dependencyContainer: DependencyContainer,
  ) {}

  registerCommands(): void {
    const groupService =
      this.dependencyContainer.resolve<GroupService>('GroupService');
    const schemaService =
      this.dependencyContainer.resolve<SchemaService>('SchemaService');

    this.command
      .command('group-create', 'Create a new schema group')
      .alias('gc')
      .option('-n, --name <name:string>', 'Name of the group to create')
      .option('-c, --color <color:string>', 'Color of the group')
      .action(async (options: any) => {
        return await CommandLogic.define<
          GroupCreatePureArgs,
          GroupCreatePureArgs,
          Group
        >()
          .withValidation((v) => {
            return v
              .for(
                (a) => a.name,
                (av) => {
                  av.defineName('name')
                    .notNull()
                    .withValidation(
                      StringValidators.validateName(options.name),
                    );
                },
              )
              .mapWithResult((a) => {
                options.color = NamedColorProvider.fromString(a.color);
                return Result.success(options);
              });
          })
          .withLogic((args) => groupService.createGroup(args.name!, args.color))
          .withResultLogging(
            (result) => `Group created with id ${result.value}`,
          )
          .execute(options);
      })
      .command('group-update', 'Update a schema group')
      .alias('gu')
      .option('-i, --id <id:number>', 'ID of the group to update')
      .option('-n, --name <name:string>', 'New name for the group')
      .option('-c, --color <color:string>', 'New color for the group')
      .action(async (options: any) => {
        return await CommandLogic.define<
          GroupUpdatePureArgs,
          GroupUpdatePureArgs,
          void
        >()
          .withValidation((v) =>
            v
              .for(
                (a) => a.id,
                (av) =>
                  av
                    .defineName('id')
                    .notNull()
                    .asNumber((nv) => nv.isPositive()),
              )
              .mapWithResult((a) => {
                options.color = NamedColorProvider.fromString(a.color);
                return Result.success(options);
              }),
          )
          .withLogic((args) =>
            groupService.updateGroup(args.id!, args.name, args.color),
          )
          .withResultLogging(() => `Group updated successfully`)
          .execute(options);
      })
      .command('group-delete', 'Delete a schema group')
      .alias('gd')
      .option('-i, --id <id:number>', 'ID of the group to delete')
      .option(
        '--move-to-default',
        'Move schemas to default group instead of deleting them',
      )
      .action(async (options: any) => {
        return await CommandLogic.define<
          GroupDeletePureArgs,
          GroupDeletePureArgs,
          void
        >()
          .withValidation((v) =>
            v
              .for(
                (a) => a.id,
                (av) =>
                  av
                    .defineName('id')
                    .notNull()
                    .asNumber((nv) => nv.isPositive()),
              )
              .map((a) => a),
          )
          .withLogic((args) =>
            groupService.deleteGroup(args.id!, Boolean(options.moveToDefault)),
          )
          .withResultLogging(() => {
            if (options.moveToDefault) {
              return 'Group deleted and schemas moved to default';
            } else {
              return 'Group and its schemas deleted';
            }
          })
          .execute(options);
      })
      .command('group-add-schema', 'Assign a schema to a group')
      .alias('gas')
      .option('-s, --schema <schema:number>', 'Schema id')
      .option('-g, --group <group:number>', 'Group id')
      .action(
        async (options: any) =>
          await CommandLogic.define<
            GroupAddSchemaPureArgs,
            GroupAddSchemaPureArgs,
            void
          >()
            .withValidation((v) =>
              v
                .for(
                  (a) => a.schema,
                  (av) =>
                    av
                      .defineName('schemaId')
                      .notNull()
                      .asNumber((nv) => nv.isPositive()),
                )
                .for(
                  (a) => a.group,
                  (av) =>
                    av
                      .defineName('groupId')
                      .notNull()
                      .asNumber((nv) => nv.isNonNegative()),
                )
                .map((a) => a),
            )
            .withLogic((args) =>
              groupService.addSchemaToGroup(args.schema!, args.group!),
            )
            .withResultLogging(
              (result) =>
                `Schema ${options.schema} assigned to group ${options.group}`,
            )
            .execute(options),
      )
      .command(
        'group-remove-schema',
        'Remove schema from its group (moves to default)',
      )
      .alias('grs')
      .option('-s, --schema <schema:number>', 'Schema id')
      .action(
        async (options: any) =>
          await CommandLogic.define<
            GroupRemoveSchemaPureArgs,
            GroupRemoveSchemaPureArgs,
            void
          >()
            .withValidation((v) =>
              v
                .for(
                  (a) => a.schema,
                  (av) =>
                    av
                      .defineName('schemaId')
                      .notNull()
                      .asNumber((nv) => nv.isPositive()),
                )
                .map((a) => a),
            )
            .withLogic((args) =>
              groupService.removeSchemaFromGroup(args.schema!),
            )
            .withResultLogging(
              (result) =>
                `Schema ${options.schema} removed from its group and moved to default`,
            )
            .execute(options),
      )
      .command('group-list', 'List all groups')
      .alias('gl')
      .option('-i, --interactive-mode', 'Enable interactive mode', {
        default: true,
      })
      .option('--list-mode', 'Enable list mode')
      .option('-p, --page <page:number>', 'Page number', { default: 1 })
      .option('-s, --size <size:number>', 'Page size', { default: 10 })
      .action(async (options: any) => {
        const isListMode = options.listMode || false;
        const isInteractive = options.interactiveMode && !isListMode;

        if (isInteractive) {
          let currentPage = Number(options.page) || 1;
          const pageSize = Number(options.size) || 10;

          const pageCheck = new NumberValidator(currentPage, 'page')
            .isPositive()
            .getResult();
          const sizeCheck = new NumberValidator(pageSize, 'size')
            .isPositive()
            .getResult();
          if (pageCheck) {
            console.error(pageCheck.errorMessage);
            return;
          }
          if (sizeCheck) {
            console.error(sizeCheck.errorMessage);
            return;
          }

          while (true) {
            const groups = await groupService.listGroups(currentPage, pageSize);
            if (!groups || groups.length === 0) {
              console.log('No groups found.');
              break;
            }

            const table = new GroupTablePage(groups, currentPage);
            table.display();

            const choice = await GroupListPrompts.groupTablePager(
              groups,
              currentPage,
            );

            if (choice === 'next') {
              currentPage++;
              continue;
            }
            if (choice === 'prev') {
              currentPage = Math.max(1, currentPage - 1);
              continue;
            }
            if (choice === 'exit') break;

            if (typeof choice === 'string' && choice.startsWith('open:')) {
              const id = Number(choice.split(':')[1]);
              const schemasResult = await schemaService.listSchemas({
                group: String(id),
                page: currentPage,
                size: 10,
                detailed: false,
              });
              if (schemasResult.isFailure()) {
                console.error(schemasResult.errorMessage);
              } else {
                const pageSchemas = schemasResult.value || [];
                if (pageSchemas.length === 0) {
                  console.log('No schemas in this group.');
                } else {
                  new SmallSchemaTablePage(pageSchemas).display();
                }
              }
            }
          }
        } else {
          const page = Number(options.page) || 1;
          const size = Number(options.size) || 10;

          const pageCheck = new NumberValidator(page, 'page')
            .isPositive()
            .getResult();
          const sizeCheck = new NumberValidator(size, 'size')
            .isPositive()
            .getResult();
          if (pageCheck) {
            console.error(pageCheck.errorMessage);
            return;
          }
          if (sizeCheck) {
            console.error(sizeCheck.errorMessage);
            return;
          }

          const result = await groupService.list(page, size);

          if (options.json) {
            console.log(JSON.stringify(result.value, null, 2));
            return;
          }

          if (result.isFailure()) {
            console.error(result.errorMessage);
            return;
          }

          const groups = result.value || [];

          if (!groups || groups.length === 0) {
            console.log('No groups found.');
            return;
          }
          const table = new GroupTablePage(groups, page);
          table.display();
        }
      });
  }
}
