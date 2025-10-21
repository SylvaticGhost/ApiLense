import { Command } from '@cliffy/command';
import { HelpCommand } from '@cliffy/command/help';
import { DependencyContainer } from './infrastructure/dependencyContainer.ts';
import { DependencyRegistration } from './infrastructure/dependencyRegistration.ts';
import { SchemaService } from './services/schemaService.ts';
import { SchemaCommandPrinters } from './utils/printers/schemaCommandPrinters.ts';
import { listSchemasCommand } from "../volume/schemas/list.ts";

async function main() {
  // --- 1. Setup Dependency Injection ---
  const container = new DependencyContainer();
  const registrator = new DependencyRegistration(container);
  await registrator.registerAll();
  const schemaService = container.resolve<SchemaService>('SchemaService');

  // --- 2. Define the Main Application Command ---
  const mainCommand = new Command()
    .name('api-lens')
    .version('0.1.0')
    .description('Web API performance testing tool')
    .command('help', new HelpCommand().global())
    .default('help');

  // --- 3. Define the "schema" Command Group ---
  const schemaCommand = new Command()
    .description('Manage API schemas.')
    .action(function() { this.showHelp(); }) // Show help if no subcommand is given

    // Attach the list command from your separate file
    .command('list', listSchemasCommand)

    // Attach the load command
    .command('load')
    .description('Load a new API schema.')
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
      const result = await schemaService.loadSchema(args);
      SchemaCommandPrinters.loadSchema(result);
    })

    // --- FULL IMPLEMENTATION FOR THE UPDATE COMMAND ---
    .command('update')
    .description('Update an existing schema by ID or name.')
    .alias('su')
    .option('-i, --id <id:string>', 'ID of the schema to update')
    .option('-n, --name <name:string>', 'Name of the schema to update')
    .option('-f, --file <file:string>', 'Path to the new schema file')
    .option('-u, --url <url:string>', 'URL of the new schema')
    .action(async (options) => {
      console.log('Updating the specified schema...');
      const args = {
        id: options.id,
        name: options.name,
        file: options.file,
        url: options.url,
      };
      // This calls your service to perform the update logic
      const result = await schemaService.updateSchema(args);
      // You can use a printer to show the result
      SchemaCommandPrinters.updateSchema(result);
    })

    // Attach the remove command
    .command('remove')
    .description('Remove a schema by ID or name.')
    .alias('sr')
    .option('-i, --id <id:string>', 'ID of the schema to remove')
    .option('-n, --name <name:string>', 'Name of the schema to remove')
    .action(async (options) => {
        console.log('Removing the specified schema...');
        const args = { id: options.id, name: options.name };
        await schemaService.removeSchema(args);
        console.log("Schema removed successfully.");
    });

  // Attach the fully configured "schema" command group to the main command
  mainCommand.command('schema', schemaCommand);

  // --- 4. Define the "group" Command Group ---
  const groupCommand = new Command()
    .description("Manage schema groups.")
    .action(function() { this.showHelp(); })
    .command('create')
    .alias('gc')
    .option('-n, --name <name:string>', 'Name of the group to create')
    .option('-c, --color <color:string>', 'Color of the group')
    .action((options) => {
      console.log('Creating schema group...');
      console.log('Options:', options);
    })
    .command('delete')
    .alias('gd')
    .option('-n, --name <name:string>', 'Name of the group to delete')
    .action((options) => {
      console.log('Deleting schema group...');
      console.log('Options:', options);
    })
    .command('remove-schema') // Renamed for clarity
    .alias('gr')
    .option('-n, --name <name:string>', 'Name of the group')
    .option('-s, --schema <schema:string>', 'Name of the schema to remove')
    .action((options) => {
      console.log('Removing schema from group...');
      console.log('Options:', options);
    });

  // Attach the fully configured "group" command to the main command
  mainCommand.command('group', groupCommand);

  // --- 5. Parse Arguments and Run the CLI ---
  if (import.meta.main) {
    await mainCommand.parse(Deno.args);
  }
}

// Execute the main function
main();