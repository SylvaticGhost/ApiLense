import { Command } from '@cliffy/command';
import { Table } from '@cliffy/table';
import { Select } from '@cliffy/prompt';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { SchemaCommandPrinters } from '../utils/printers/schemaCommandPrinters.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import {
  SchemaEndpointsListArgs,
  SchemaRemoveArgs,
} from '../contracts/schemaCommandsArgs.ts';
import { EndpointMetaData } from '../core/endpoint.ts';
import { StringBuilder } from '../utils/stringBuilder.ts';
import { PagedList } from '../utils/types/pagedList.ts';
import { ColorProvider } from '../infrastructure/providers/colorProvider.ts';
import { HTTP_METHODS } from '../core/enums.ts';
import { SchemaCommandStrings } from './output/schemaCommandStrings.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { TemplateFillingService } from '../services/templateFillingService.ts';
import { FileUrl } from '../utils/types/fileUrl.ts';
import { colors } from '@cliffy/ansi/colors';
import { TemplateCommandStrings } from './output/templateCommandStrings.ts';

interface SchemaRemovePureArgs {
  schemaId?: number | undefined;
}

interface SchemaEndpointsListPureArgs {
  schemaId?: number | undefined;
  method?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
}

export class SchemaCommandDispatcher {
  private readonly schemaService: SchemaService;
  private readonly templateFillingService: TemplateFillingService;

  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {
    this.schemaService = this.container.resolve<SchemaService>('SchemaService');
    this.templateFillingService =
      this.container.resolve<TemplateFillingService>('TemplateFillingService');
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
          let schemas: ApiSchema[] | undefined = undefined;
          let selectedSchemaId: number | undefined = undefined;
          let selectedEndpointName: string | undefined = undefined;

          let state: 'LIST' | 'DETAILS' | 'ENDPOINTS' | 'CLOSE' = 'LIST';

          while (state !== 'CLOSE') {
            if (state === 'LIST') {
              if (!schemas) {
                const listResult = await this.schemaService.listSchemas({
                  group: options.group,
                  page: options.page,
                  size: options.size,
                  detailed: options.detailed,
                });

                if (listResult.isFailure()) {
                  console.error(listResult.errorMessage);
                  return;
                }

                schemas = listResult.value;
              }
              if (!schemas) throw new Error('Schemas should be defined here');

              Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
              const selectedId = await Select.prompt({
                message: 'Select a schema to view details',
                options: schemas.map((s: any) => ({
                  name: SchemaCommandStrings.schemaRowPreview(s),
                  value: s.id.toString(),
                })),
              });

              selectedSchemaId = Number(selectedId);
              state = 'DETAILS';
            } else if (state === 'DETAILS') {
              if (!selectedSchemaId)
                throw new Error('Selected schema ID should be defined here');
              if (!schemas) throw new Error('Schemas should be defined here');

              const selectedSchema = schemas!.find(
                (s: any) => s.id === selectedSchemaId,
              );

              if (!selectedSchema)
                throw new Error('Selected schema should be defined here');

              console.info(
                SchemaCommandStrings.schemaDetails(selectedSchema, true),
              );

              Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
              const action = await Select.prompt({
                message: 'Next action',
                options: [
                  { name: 'Return to list', value: 'return' },
                  { name: 'List endpoints', value: 'endpoints' },
                  { name: 'Close', value: 'close' },
                ],
              });

              if (action === 'return') {
                state = 'LIST';
              } else if (action === 'endpoints') {
                state = 'ENDPOINTS';
              } else {
                state = 'CLOSE';
              }
            } else if (state === 'ENDPOINTS') {
              if (!selectedSchemaId)
                throw new Error('Selected schema ID should be defined here');

              const httpMethodOptions = [
                { name: 'All methods', value: 'ALL' },
                ...(
                  Object.keys(HTTP_METHODS) as Array<keyof typeof HTTP_METHODS>
                ).map((m) => ({
                  name: new StringBuilder()
                    .appendColor(m, ColorProvider.getHttpMethodColor(m))
                    .toString(),
                  value: m,
                })),
              ] as Array<{ name: string; value: string }>;

              Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
              const methodChoice = await Select.prompt({
                message: 'Filter endpoints by HTTP method',
                options: httpMethodOptions,
              });

              const endpointsResult =
                await this.schemaService.listSchemaEndpoints({
                  schemaId: selectedSchemaId,
                  page: 1,
                  size: 999,
                  method:
                    methodChoice === 'ALL'
                      ? undefined
                      : (methodChoice as keyof typeof HTTP_METHODS),
                });

              if (endpointsResult.isFailure()) {
                console.error(endpointsResult.errorMessage);
                return;
              }

              const pagedList =
                endpointsResult.castValueStrict<PagedList<EndpointMetaData>>();

              const sb = new StringBuilder();
              sb.appendLine(
                `Endpoints for schema ${selectedSchemaId} (Page ${pagedList.page} of ${Math.ceil(
                  pagedList.totalCount / pagedList.size,
                )}):`,
              );

              let endpointState: 'SELECT' | 'ACTIONS' | 'BACK' | 'CLOSE' =
                'SELECT';
              let selectedEndpoint: EndpointMetaData | undefined;

              const methodFilter =
                methodChoice === 'ALL'
                  ? undefined
                  : (methodChoice as keyof typeof HTTP_METHODS);

              while (endpointState !== 'BACK' && endpointState !== 'CLOSE') {
                if (endpointState === 'SELECT') {
                  Deno.stdout.writeSync(
                    new TextEncoder().encode('\x1b[2J\x1b[H'),
                  );
                  const selectedEndpointId = await Select.prompt({
                    message: `Select endpoint (${methodFilter ?? 'ALL'})`,
                    options: pagedList.items.map((e) => ({
                      name: new StringBuilder()
                        .append('[')
                        .appendColor(
                          e.method,
                          ColorProvider.getHttpMethodColor(e.method),
                        )
                        .append('] ')
                        .append(e.path)
                        .toString(),
                      value: e.name,
                    })),
                  });

                  selectedEndpoint = pagedList.items.find(
                    (e) => e.name === selectedEndpointId,
                  );
                  if (!selectedEndpoint) {
                    console.error('Endpoint not found');
                    endpointState = 'SELECT';
                  } else {
                    endpointState = 'ACTIONS';
                  }
                } else if (endpointState === 'ACTIONS' && selectedEndpoint) {
                  const detailsSb = new StringBuilder();
                  detailsSb
                    .appendLine()
                    .appendLine(colors.bold('Endpoint details:'))
                    .append('- Name: ')
                    .appendLine(selectedEndpoint.name)
                    .append('- Method: ')
                    .appendColor(
                      selectedEndpoint.method,
                      ColorProvider.getHttpMethodColor(selectedEndpoint.method),
                    )
                    .append('\n')
                    .append('- Path: ')
                    .appendLine(selectedEndpoint.path);
                  console.info(detailsSb.toString());

                  const nextAction = await Select.prompt({
                    message: 'Endpoint action',
                    options: [
                      { name: 'Copy path', value: 'copy_path' },
                      { name: 'Copy method+path', value: 'copy_full' },
                      { name: 'List templates', value: 'list_templates' },
                      { name: 'Select another endpoint', value: 'reselect' },
                      { name: 'Change method filter', value: 'refilter' },
                      { name: 'Return to schema details', value: 'back' },
                      { name: 'Close', value: 'close' },
                    ],
                  });

                  if (nextAction === 'copy_path') {
                    console.info(selectedEndpoint.path);
                    endpointState = 'ACTIONS';
                  } else if (nextAction === 'copy_full') {
                    console.info(
                      `${selectedEndpoint.method} ${selectedEndpoint.path}`,
                    );
                    endpointState = 'ACTIONS';
                  } else if (nextAction === 'reselect') {
                    endpointState = 'SELECT';
                  } else if (nextAction === 'refilter') {
                    endpointState = 'BACK'; // go up, re-enter ENDPOINTS
                  } else if (nextAction === 'back') {
                    endpointState = 'BACK';
                  } else if (nextAction === 'list_templates') {
                    const templatesResult =
                      await this.templateFillingService.listTemplates(
                        selectedSchemaId,
                        selectedEndpoint.name,
                      );

                    if (templatesResult.isFailure()) {
                      console.error(templatesResult.errorMessage);
                      endpointState = 'ACTIONS';
                    } else {
                      const templates = templatesResult.value;
                      if (!templates || templates.length === 0) {
                        console.info();
                        console.info(
                          colors.bold.yellow(
                            'No templates found for this endpoint ⚠️',
                          ),
                        );
                        console.info();
                      } else {
                        const selectionOptions = templates.map((t) => ({
                          name: t.name,
                          value: t.name,
                        }));

                        selectionOptions.push({
                          name: 'Back',
                          value: '__back',
                        });

                        Deno.stdout.writeSync(
                          new TextEncoder().encode('\x1b[2J\x1b[H'),
                        );

                        const selectedTemplate = await Select.prompt({
                          message: 'Select a template to view details',
                          options: templates.map((t) => ({
                            name: t.name,
                            value: t.name,
                          })),
                        });

                        if (selectedTemplate === '__back') {
                          endpointState = 'ACTIONS';
                        } else {
                          const template = templates.find(
                            (t) => t.name === selectedTemplate,
                          );
                          if (template) {
                            console.info(
                              TemplateCommandStrings.templateDetails(template),
                            );

                            const actionOnTemplate = await Select.prompt({
                              message: 'Select action with template',
                              options: [
                                {
                                  name: 'Return',
                                  value: 'return',
                                },
                                {
                                  name: 'Run test',
                                  value: 'run_test',
                                },
                                {
                                  name: 'Delete',
                                  value: 'details',
                                },
                                {
                                  name: 'Close',
                                  value: 'close',
                                },
                              ],
                            });

                            if (actionOnTemplate === 'back')
                              endpointState = 'ACTIONS';
                            else if (actionOnTemplate === 'close')
                              endpointState = 'CLOSE';
                          } else {
                            console.error('Template not found');
                          }
                          endpointState = 'ACTIONS';
                        }
                      }
                    }
                  } else {
                    endpointState = 'CLOSE';
                  }
                }
              }

              if (endpointState === 'BACK') {
                // Decide where to go: if user chose refilter, stay in ENDPOINTS; else return to DETAILS.
                state = 'DETAILS';
              } else {
                state = 'CLOSE';
              }
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

            console.info(
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
