import { Command } from '@cliffy/command';
import { Table } from '@cliffy/table';
import { Select } from '@cliffy/prompt';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { SchemaCommandPrinters } from '../utils/printers/schemaCommandPrinters.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import {
  LoadSchemaArgs,
  SchemaEndpointsListArgs,
  SchemaRemoveArgs,
} from '../contracts/schemaCommandsArgs.ts';
import { EndpointMetaData } from '../core/endpoint.ts';
import { StringBuilder } from '../utils/stringBuilder.ts';
import { PagedList } from '../utils/types/pagedList.ts';
import { ColorProvider } from '../infrastructure/providers/colorProvider.ts';
import { HTTP_METHODS } from '../core/enums.ts';
import { PureArgs } from '../contracts/commonArgs.ts';
import { ApiSchema } from '../core/apiSchema.ts';

interface SchemaLoadPureArgs extends PureArgs {
  file?: string | undefined;
  url?: string | undefined;
  name?: string | undefined;
  group?: string | undefined;
}

interface SchemaRemovePureArgs extends PureArgs {
  schemaId?: number | undefined;
}

interface SchemaEndpointsListPureArgs extends PureArgs {
  schemaId?: number | undefined;
  method?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
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

        return CommandLogic.define<
          SchemaLoadPureArgs,
          LoadSchemaArgs,
          ApiSchema
        >()
          .withValidation((argValidator) => {
            argValidator
              .for(
                (a) => a.file,
                (v) => v.defineName('file').optional(),
              )
              .for(
                (a) => a.url,
                (v) => v.defineName('url').optional(),
              )
              .for(
                (a) => a.name,
                (v) => v.defineName('name').optional(),
              )
              .for(
                (a) => a.group,
                (v) => v.defineName('group').optional(),
              )
              .map((args) => {
                return args as LoadSchemaArgs;
              });
          })
          .withLogic(async (args) => {
            return await this.schemaService.loadSchema(args);
          })
          .withResultDisplay((result) => {
            SchemaCommandPrinters.loadSchema(result);
          })
          .execute(args);
      })

      // schema-list
      .command('schema-list', 'List all loaded schemas')
      .alias('sl')
      .option('-i, --interactive-mode', 'Enable interactive mode', {
        default: false,
      })
      .option('-l, --list-mode', 'Enable list mode')
      .option('-g, --group <group:string>', 'Filter by group ID or name')
      .option('-p, --page <page:number>', 'Page number', { default: 1 })
      .option('-s, --size <size:number>', 'Page size', { default: 10 })
      .option(
        '-d, --detailed',
        'Display detailed information (Creation date, Last usages)',
      )
      .action(async (options) => {
        const isListMode = options.listMode || false;
        const isInteractive = options.interactiveMode && !isListMode;

        const result = await this.schemaService.listSchemas({
          group: options.group,
          page: options.page,
          size: options.size,
          detailed: options.detailed,
        });

        if (result.isFailure()) {
          console.error(result.errorMessage);
          return;
        }

        const schemas = result.value;

        if (!schemas || schemas.length === 0) {
          console.log('No schemas found.');
          return;
        }

        if (isInteractive) {
          const selectedId = await Select.prompt({
            message: 'Select a schema to view details',
            options: schemas.map((s: any) => ({
              name: `${s.name} (ID: ${s.id}) ${s.Group ? `[${s.Group.name}]` : ''}`,
              value: s.id.toString(),
            })),
          });

          const selectedSchema = schemas.find(
            (s: any) => s.id.toString() === selectedId,
          );
          if (selectedSchema) {
            console.log('\nSchema Details:');
            console.log(`ID:           ${selectedSchema.id}`);
            console.log(`Name:         ${selectedSchema.name}`);
            console.log(`Group:        ${selectedSchema.Group?.name || 'N/A'}`);
            console.log(`URL:          ${selectedSchema.url || 'N/A'}`);
            if (options.detailed) {
              console.log(`Created At:   ${selectedSchema.createdAt}`);
              console.log(`Last Usage:   ${selectedSchema.updatedAt}`);
            }
          }
        } else {
          let currentPage = Number(options.page) || 1;
          const pageSize = Number(options.size) || 10;

          while (true) {
            const resultPage = await this.schemaService.listSchemas({
              group: options.group,
              page: currentPage,
              size: pageSize,
              detailed: options.detailed,
            });

            if (resultPage.isFailure()) {
              console.error(resultPage.errorMessage);
              break;
            }

            const pageSchemas = resultPage.value || [];

            const header = ['ID', 'Name', 'Group', 'URL'];
            if (options.detailed) {
              header.push('Created At', 'Last Usage');
            }

            const table = new Table().header(header);

            pageSchemas.forEach((s: any) => {
              const url = s.url || '-';
              const shortUrl = url.length > 80 ? url.slice(0, 77) + '...' : url;
              const row = [
                s.id.toString(),
                s.name,
                s.Group?.name || '-',
                shortUrl,
              ];

              if (options.detailed) {
                row.push(
                  s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : '-',
                );
                row.push(
                  s.updatedAt
                    ? new Date(s.updatedAt).toLocaleDateString()
                    : '-',
                );
              }

              table.push(row);
            });

            console.log(
              `\nPage ${currentPage} — showing ${pageSchemas.length} item(s) (size ${pageSize})`,
            );
            table.render();

            const canPrev = currentPage > 1;
            const canNext = pageSchemas.length === pageSize;

            const navOptions: Array<{ name: string; value: string }> = [];
            if (canPrev)
              navOptions.push({ name: '⟵ Prev page', value: 'prev' });
            if (canNext)
              navOptions.push({ name: 'Next page ⟶', value: 'next' });
            navOptions.push({ name: 'Exit', value: 'exit' });

            const choice = await Select.prompt({
              message: 'Navigate pages',
              options: navOptions,
            });

            if (choice === 'prev') {
              currentPage = Math.max(1, currentPage - 1);
            } else if (choice === 'next') {
              currentPage = currentPage + 1;
            } else {
              break;
            }
          }
        }
      })
      //schema-endpoints-list
      .command('schema-endpoints-list', 'List endpoints of a specified schema')
      .alias('sel')
      .option('-s, --schema-id <id:number>', 'ID of the schema')
      .option('--page <page:number>', 'Page number', { default: 1 })
      .option('--size <size:number>', 'Page size', { default: 10 })
      .option(
        '-m, --method <method:string>',
        'Filter by HTTP method (GET, POST, etc.)',
      )
      .action((options) => {
        return CommandLogic.define<
          SchemaEndpointsListPureArgs,
          SchemaEndpointsListArgs,
          void
        >()
          .withValidation((argValidator) =>
            argValidator
              .for(
                (a) => a.schemaId,
                (v) =>
                  v
                    .defineName('schema id')
                    .notNull()
                    .asNumber((nv) => nv.isNatural()),
              )
              .for(
                (a) => a.page,
                (v) =>
                  v
                    .defineName('page')
                    .optional()
                    .asNumber((nv) => nv.isNatural().min(1).max(99)),
              )
              .for(
                (a) => a.size,
                (v) =>
                  v
                    .defineName('size')
                    .optional()
                    .asNumber((nv) => nv.isNatural().min(1).max(99)),
              )
              .for(
                (a) => a.method,
                (v) =>
                  v
                    .defineName('method')
                    .optional()
                    .asString((sv) => sv.convertableToEnum(HTTP_METHODS)),
              )
              .map((args) => {
                return {
                  schemaId: args.schemaId!,
                  page: args.page ?? 1,
                  size: args.size ?? 10,
                  method: args.method
                    ? (args.method.toUpperCase() as keyof typeof HTTP_METHODS)
                    : undefined,
                } as SchemaEndpointsListArgs;
              }),
          )
          .withLogic(async (args) => {
            return await this.schemaService.listSchemaEndpoints(args);
          })
          .withResultDisplay((result) => {
            const pagedList =
              result.castValueStrict<PagedList<EndpointMetaData>>();
            const sb = new StringBuilder();
            sb.appendLine(
              `Endpoints for schema ${pagedList.items[0].schemaId} (Page ${pagedList.page} of ${Math.ceil(pagedList.totalCount / pagedList.size)}):`,
            );
            for (const endpoint of pagedList.items) {
              sb.append('- [');
              sb.appendColor(
                endpoint.method,
                ColorProvider.getHttpMethodColor(endpoint.method),
              );
              sb.append(`] ${endpoint.path} (Name: ${endpoint.name})\n`);
            }
            console.info(sb.toString());
          })
          .execute(options);
      })

      // schema-remove
      .command('schema-remove', 'Remove specified schema by ID or name')
      .alias('sr')
      .option('-s, --schema-id <id:number>', 'ID of the schema to remove')
      .action(async (options) => {
        await CommandLogic.define<
          SchemaRemovePureArgs,
          SchemaRemoveArgs,
          string
        >()
          .withValidation((argValidator) =>
            argValidator
              .for(
                (a) => a.schemaId,
                (v) =>
                  v
                    .defineName('schema id')
                    .notNull()
                    .asNumber((nv) => nv.isNatural()),
              )
              .map((args) => {
                return { id: args.schemaId! } as SchemaRemoveArgs;
              }),
          )
          .withLogic(async (args) => {
            const result = await this.schemaService.removeSchema(args);
            return result;
          })
          .withResultDisplay(() => {
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
