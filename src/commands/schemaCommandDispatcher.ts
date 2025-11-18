import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { SchemaCommandPrinters } from '../utils/printers/schemaCommandPrinters.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { SchemaRemoveArgs } from '../contracts/schemaCommandsArgs.ts';
import { Result } from '../utils/result.ts';

interface SchemaRemovePureArgs {
  id?: number | undefined;
}

export class SchemaCommandDispatcher {
  private readonly schemaService: SchemaService;

  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {
    this.schemaService = this.container.resolve<SchemaService>('SchemaService');
  }

  public registerCommands(): void {
    this.command
      // schema-load
      .command('load')
      .description('Load an API schema')
      .option('-f, --file <file:string>', 'Path to the schema file')
      .option('-u, --url <url:string>', 'URL of the schema')
      .option('-n, --name <name:string>', 'Name of the schema')
      .option('-g, --group <group:string>', 'Group to assign the schema to')
      .action(async (options) => {
        const args = {
          file: options.file,
          url: options.url,
          name: options.name,
          group: options.group,
        };
        const result = await this.schemaService.loadSchema(args);

        SchemaCommandPrinters.loadSchema(result);
      })
      // schema-list
      .command('schema-list', 'List all loaded schemas')
      .alias('sl')
      .option('-g, --group <group:string>', 'Group of schemas to list')
      .action((options) => {
        console.log('Listing all loaded schemas...');
        if (options.group) {
          console.log('Group:', options.group);
        }
      })
      // schema-remove
      .command('schema-remove', 'Remove specified schema by ID or name')
      .alias('sr')
      .option('-i, --id <id:number>', 'ID of the schema to remove')
      // .option('-n, --name <name:string>', 'Name of the schema to remove')
      .action(async (options) => {
        await CommandLogic.define<
          SchemaRemovePureArgs,
          SchemaRemoveArgs,
          string
        >()
          .withValidation((argValidator) =>
            argValidator
              .for(
                (a) => a.id,
                (v) =>
                  v
                    .defineName('schema id')
                    .notNull()
                    .asNumber((nv) => nv.isNatural()),
              )
              .map((args) => {
                return { id: args.id! } as SchemaRemoveArgs;
              }),
          )
          .withLogic(async (args) => {
            const result = await this.schemaService.removeSchema(args);
            return result;
          })
          .withResultDisplay((result) => {
            console.info(`Schema removed successfully`);
          })
          .execute(options);
      })
      // schema-update
      .command('schema-update', 'Update an existing schema by ID or name')
      .alias('su')
      .option('-i, --id <id:string>', 'ID of the schema to update')
      .option('-n, --name <name:string>', 'Name of the schema to update')
      .option('-f, --file <file:string>', 'Path to the new schema file')
      .option('-u, --url <url:string>', 'URL of the new schema')
      .action((options) => {
        console.log('Updating the specified schema...');
        console.log('Options:', options);
      })
      // schema (details)
      .command('schema', 'Show API Schema details')
      .alias('s')
      .option('-i, --id <id:string>', 'ID of the schema to show')
      .option('-n, --name <name:string>', 'Name of the schema to show')
      .action((options) => {
        console.log('Showing schema details...');
        console.log('Options:', options);
      });
  }
}
