import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { GroupService } from '../services/groupService.ts';
import { SchemaService } from '../services/schemaService.ts';
import { Select } from '@cliffy/prompt';
import { Table } from '@cliffy/table';
import { StringValidators } from '../validators/stringValidators.ts';
import { NumberValidator } from '../validators/numberValidator.ts';

export class GroupCommandDispatcher implements IDispatcher {
  constructor(
    private readonly command: Command,
    private readonly dependencyContainer: DependencyContainer,
  ) {}

  registerCommands(): void {
    const groupService = this.dependencyContainer.resolve<GroupService>(
      'GroupService',
    );
    const schemaService = this.dependencyContainer.resolve<SchemaService>(
      'SchemaService',
    );

    this.command
      .command('group-create', 'Create a new schema group')
      .alias('gc')
      .option('-n, --name <name:string>', 'Name of the group to create')
      .option('-c, --color <color:string>', 'Color of the group')
      .action(async (options: any) => {
        if (!options.name) {
          console.error('Name is required');
          return;
        }
        const valid = StringValidators.validateName(options.name);
        if (valid.isFailure()) {
          console.error(valid.errorMessage);
          return;
        }

        const result = await groupService.createGroup(options.name, options.color);
        if (result.isFailure()) {
          console.error(result.errorMessage);
        } else {
          console.log(`Group created with id ${result.value}`);
        }
      })

      .command('group-update', 'Update a schema group')
      .alias('gu')
      .option('-i, --id <id:number>', 'ID of the group to update')
      .option('-n, --name <name:string>', 'New name for the group')
      .option('-c, --color <color:string>', 'New color for the group')
      .action(async (options: any) => {
        const id = Number(options.id);
        const idCheck = new NumberValidator(id, 'id').isPositive().getResult();
        if (idCheck) {
          console.error(idCheck.errorMessage);
          return;
        }

        const result = await groupService.updateGroup(id, options.name, options.color);
        if (result.isFailure()) {
          console.error(result.errorMessage);
        } else {
          console.log('Group updated');
        }
      })

      .command('group-delete', 'Delete a schema group')
      .alias('gd')
      .option('-i, --id <id:number>', 'ID of the group to delete')
      .option('--move-to-default', 'Move schemas to default group instead of deleting them')
      .action(async (options: any) => {
        const id = Number(options.id);
        const idCheck = new NumberValidator(id, 'id').isPositive().getResult();
        if (idCheck) {
          console.error(idCheck.errorMessage);
          return;
        }

        const result = await groupService.deleteGroup(id, Boolean(options.moveToDefault));
        if (result.isFailure()) {
          console.error(result.errorMessage);
        } else {
          if (options.moveToDefault) {
            console.log('Group deleted and schemas moved to default');
          } else {
            console.log('Group and its schemas deleted');
          }
        }
      })

      .command('group-add-schema', 'Assign a schema to a group')
      .alias('gas')
      .option('-s, --schema <schema:number>', 'Schema id')
      .option('-g, --group <group:number>', 'Group id')
      .action(async (options: any) => {
        // Validate inputs
        const schemaId = Number(options.schema);
        const groupId = Number(options.group);

        const sCheck = new NumberValidator(schemaId, 'schema').isPositive().getResult();
        if (sCheck) { console.error(sCheck.errorMessage); return; }
        const gCheck = new NumberValidator(groupId, 'group').isNonNegative().getResult();
        if (gCheck) { console.error(gCheck.errorMessage); return; }

        const result = await groupService.addSchemaToGroup(schemaId, groupId);
        if (result.isFailure()) {
          console.error(result.errorMessage);
        } else {
          console.log(`Schema ${schemaId} assigned to group ${groupId}`);
        }
      })

      .command('group-remove-schema', 'Remove schema from its group (moves to default)')
      .alias('grs')
      .option('-s, --schema <schema:number>', 'Schema id')
      .action(async (options: any) => {
        const schemaId = Number(options.schema);
        const sCheck = new NumberValidator(schemaId, 'schema').isPositive().getResult();
        if (sCheck) { console.error(sCheck.errorMessage); return; }

        const result = await groupService.removeSchemaFromGroup(schemaId);
        if (result.isFailure()) {
          console.error(result.errorMessage);
        } else {
          console.log(`Schema ${schemaId} moved to default group`);
        }
      })

      .command('group-list', 'List all groups')
      .alias('gl')
      .option('-i, --interactive-mode', 'Enable interactive mode', { default: true })
      .option('--list-mode', 'Enable list mode')
      .option('-p, --page <page:number>', 'Page number', { default: 1 })
      .option('-s, --size <size:number>', 'Page size', { default: 10 })
      .action(async (options: any) => {
        const isListMode = options.listMode || false;
        const isInteractive = options.interactiveMode && !isListMode;

        if (isInteractive) {
          // interactive with arrow navigation similar to schemas
          let currentPage = Number(options.page) || 1;
          const pageSize = Number(options.size) || 10;

          const pageCheck = new NumberValidator(currentPage, 'page').isPositive().getResult();
          const sizeCheck = new NumberValidator(pageSize, 'size').isPositive().getResult();
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

            const header = ['ID', 'Name', 'Color'];
            const table = new Table().header(header);
            groups.forEach((g: any) => {
              table.push([g.id.toString(), g.name, g.color || '-']);
            });

            console.log(`\nPage ${currentPage} — showing ${groups.length} group(s)`);
            table.render();

            const choice = await Select.prompt({
              message: 'Open group or navigate',
              options: [
                ...groups.map((g: any) => ({ name: `${g.name} (ID:${g.id})`, value: `open:${g.id}` })),
                { name: 'Next page', value: 'next' },
                { name: 'Prev page', value: 'prev' },
                { name: 'Exit', value: 'exit' },
              ],
            });

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
              // show schemas in this group interactively
              const schemasResult = await schemaService.listSchemas({ group: String(id), page: 1, size: 10, detailed: false });
              if (schemasResult.isFailure()) {
                console.error(schemasResult.errorMessage);
              } else {
                const pageSchemas = schemasResult.value || [];
                if (pageSchemas.length === 0) {
                  console.log('No schemas in this group.');
                } else {
                  const header = ['ID', 'Name', 'URL'];
                  const t = new Table().header(header);
                  pageSchemas.forEach((s: any) => {
                    const shortUrl = s.url ? (s.url.length > 80 ? s.url.slice(0, 77) + '...' : s.url) : '-';
                    t.push([s.id.toString(), s.name, shortUrl]);
                  });
                  t.render();
                }
              }
            }
          }
        } else {
          // list mode
          const page = Number(options.page) || 1;
          const size = Number(options.size) || 10;

          const pageCheck = new NumberValidator(page, 'page').isPositive().getResult();
          const sizeCheck = new NumberValidator(size, 'size').isPositive().getResult();
          if (pageCheck) {
            console.error(pageCheck.errorMessage);
            return;
          }
          if (sizeCheck) {
            console.error(sizeCheck.errorMessage);
            return;
          }
          const groups = await groupService.listGroups(page, size);
          if (!groups || groups.length === 0) {
            console.log('No groups found.');
            return;
          }
          const header = ['ID', 'Name', 'Color'];
          const table = new Table().header(header);
          groups.forEach((g: any) => table.push([g.id.toString(), g.name, g.color || '-']));
          table.render();
        }
      });
  }
}
