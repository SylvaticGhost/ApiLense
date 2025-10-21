import { Command } from '@cliffy/command';
import { Select } from '@cliffy/prompt';
import { bold, cyan, dim, yellow, gray, red } from '@std/fmt/colors';
import { SchemaService, SchemaListItem } from '../../services/schemaService.ts';

// We assume SchemaListItem has a structure like the mock data in your list.ts
/*
export interface SchemaListItem {
  id: string | number;
  name: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
  group?: {
    id: string | number;
    name: string;
  };
}
*/

export class SchemaCommandDispatcher {
  constructor(private readonly schemaService: SchemaService) {}

  public register(command: Command) {
    const schemaCommand = new Command()
      .description('Manage API schemas.')
      .action(() => schemaCommand.showHelp())

      .command('list', this.createListCommand());


    command.command('schema', schemaCommand);
  }

  private createListCommand(): Command {
    return new Command()
      .description('List available schemas.')
      .option('--list-mode', 'Show in a non-interactive list.')
      .option('-g, --group <idOrName:string>', 'Filter schemas by group ID or name.')
      .option('-p, --page <page:number>', 'Page number for list mode.', { default: 1 })
      .option('-s, --size <size:number>', 'Number of items per page for list mode.', { default: 10 })
      .option('-d, --detailed', 'Show detailed information.')
      .action(async (options) => {
        // Using hasOwn checks if the user explicitly typed the flag
        const isListMode = options.listMode;
        const hasPaginationFlags = options.page !== 1 || options.size !== 10;

        try {
          const schemas = await this.schemaService.getSchemas({
            group: options.group,
            page: options.page,
            size: options.size,
          });

          // Default to interactive mode unless --list-mode or pagination flags are used
          if (isListMode || hasPaginationFlags) {
            this.displayListMode(schemas, options);
          } else {
            await this.displayInteractiveMode(schemas);
          }
        } catch (error) {
          console.error(red(`\nError: ${error.message}`));
          Deno.exit(1);
        }
      });
  }



  private formatSchema(schema: SchemaListItem, isDetailed: boolean): string {
    const group = schema.group ? `${schema.group.name} (id: ${schema.group.id})` : 'N/A';
    let output = `  ${bold('ID:')} ${schema.id}\n  ${bold('Name:')} ${schema.name}\n  ${bold('Group:')} ${group}\n  ${bold('URL:')} ${schema.url || 'N/A'}`;
    if (isDetailed) {
      output += `\n  ${bold('Created:')} ${new Date(schema.createdAt).toLocaleString()}\n  ${bold('Last Usage:')} ${new Date(schema.updatedAt).toLocaleString()}`;
    }
    return output;
  }

  private displayListMode(schemas: SchemaListItem[], options: { page: number; size: number; detailed?: boolean; }) {
    if (!schemas || schemas.length === 0) {
        console.log(red('No schemas found for the current filter/page.'));
        return;
    }

    console.log(cyan(bold(`\nTotal Schemas Found: ${schemas.length}\n`)));

    const startIndex = (options.page - 1) * options.size;
    const endIndex = startIndex + options.size;
    const schemasToDisplay = schemas.slice(startIndex, endIndex);

    if (options.page > 1 || options.size !== 10) {
       console.log(yellow(`Displaying page ${options.page} (items ${startIndex + 1}-${Math.min(endIndex, schemas.length)})\n`));
    }

    schemasToDisplay.forEach(schema => {
      console.log(this.formatSchema(schema, !!options.detailed));
      console.log(gray('----------------------------------------'));
    });
  }

  private async displayInteractiveMode(schemas: SchemaListItem[]) {
    if (!schemas || schemas.length === 0) {
      console.log(red('No schemas found to display.'));
      return;
    }

    const selectedSchemaId = await Select.prompt({
      message: 'Select a schema to see details (Search by typing)',
      options: schemas.map(schema => ({
        name: `${schema.name.padEnd(20, ' ')}\t${gray(schema.group?.name || '')}`,
        value: schema.id.toString(),
      })),
      search: true,
    });

    const selectedSchema = schemas.find(s => s.id.toString() === selectedSchemaId);
    if (selectedSchema) {
      console.log(cyan(bold('\nSchema Details:')));
      console.log(this.formatSchema(selectedSchema, true));
    }
  }
}