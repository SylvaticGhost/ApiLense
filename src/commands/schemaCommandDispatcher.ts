import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { SchemaCommandPrinters } from '../utils/printers/schemaCommandPrinters.ts';
import {
  ListSchemaArgs,
  LoadSchemaArgs,
} from '../contracts/schemaCommandsArgs.ts';
import { colors } from '@std/fmt/colors';

export class SchemaCommandDispatcher {
  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {}

  public registerCommands(): void {
    this.command
      .command('load')
      .description('Load an API schema')
      .option('-f, --file <file:string>', 'Path to the schema file')
      .option('-u, --url <url:string>', 'URL of the schema')
      .option('-n, --name <name:string>', 'Name of the schema')
      .option('-g, --group <group:string>', 'Group to assign the schema to')
      .action(async (options) => {
        const schemaService =
          this.container.resolve<SchemaService>('SchemaService');
        const args: LoadSchemaArgs = {
          file: options.file,
          url: options.url,
          name: options.name,
          group: options.group,
        };
        const result = await schemaService.loadSchema(args);
        SchemaCommandPrinters.loadSchema(result);
      })

      .command('schema-list', 'List all loaded schemas')
      .alias('sl')
      .description(
        'Lists schemas with filters, pagination, and interactive mode.',
      )
      .option('-g, --group <group:string>', 'Filter by group ID or name')
      .option(
        '-p, --page <page:number>',
        'Page number for list mode',
        { default: 1 },
      )
      .option(
        '-s, --size <size:number>',
        'Page size for list mode (if not set, pagination is off)',
      )
      .option('-d, --detailed', 'Show detailed info in list mode')
      .option('--list-mode', 'Force simple list output')
      .option(
        '-i, --interactive-mode',
        'Force interactive mode (overrides pagination)',
      )
      .action(async (options) => {
        const schemaService =
          this.container.resolve<SchemaService>('SchemaService');

        const args: ListSchemaArgs = {
          group: options.group,
          page: options.page,
          size: options.size ? Number(options.size) : undefined,
        };

        try {
          const result = await schemaService.getSchemas(args);

          const hasPaginationFlags = options.page !== 1 || !!options.size;
          const isListMode = options.listMode || hasPaginationFlags;

          if (options.interactiveMode) {
            await SchemaCommandPrinters.displayInteractiveMode(result);
          } else if (isListMode) {
            SchemaCommandPrinters.displayListMode(result, {
              detailed: !!options.detailed,
            });
          } else {
            await SchemaCommandPrinters.displayInteractiveMode(result);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(
            colors.red(`\nAn unexpected error occurred: ${message}`),
          );
          Deno.exit(1);
        }
      })

      .command('schema-remove', 'Remove specified schema by ID or name')
      .alias('sr')
      .option('-i, --id <id:string>', 'ID of the schema to remove')
      .option('-n, --name <name:string>', 'Name of the schema to remove')
      .action((options) => {
        console.log('Removing the specified schema...');
        console.log('Options:', options);
      })

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