import { Command } from '@cliffy/command';
import { DependencyContainer } from '../../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../../services/schemaService.ts';
import { SchemaCommandPrinters } from '../../utils/printers/schemaCommandPrinters.ts';
import { CommandLogic } from '../../infrastructure/commandLogic.ts';
import {
  LoadSchemaArgs,
  SchemaEndpointsListArgs,
  SchemaRemoveArgs,
} from '../../contracts/schemaCommandsArgs.ts';
import { EndpointMetaData } from '../../core/endpoint.ts';
import { StringBuilder } from '../../utils/stringBuilder.ts';
import { PagedList } from '../../utils/types/pagedList.ts';
import { ColorProvider } from '../../infrastructure/providers/colorProvider.ts';
import { HTTP_METHODS } from '../../core/enums.ts';
import { SchemaCommandStrings } from './../outputs/schemaCommandStrings.ts';
import { ApiSchema } from '../../core/apiSchema.ts';
import { TemplateFillingService } from '../../services/templateFillingService.ts';
import { TemplateCommandStrings } from './../outputs/templateCommandStrings.ts';
import { PureArgs } from '../../contracts/commonArgs.ts';
import { SchemaListPrompts } from '../utils/schemaListPromts.ts';
import {
  EndpointListDisplayStateMachine,
  SchemaListDisplayStateMachine,
} from '../utils/schemaCommandsStates.ts';
import { SchemaTablePage } from '../outputs/schemaTablePage.ts';

interface SchemaLoadPureArgs extends PureArgs {
  file?: string | undefined;
  url?: string | undefined;
  name?: string | undefined;
  group?: string | undefined;
}

interface SchemaListPureArgs extends PureArgs {
  interactiveMode?: boolean | undefined;
  listMode?: boolean | undefined;
  group?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
  detailed?: boolean | undefined;
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
      .action((options) => {
        return CommandLogic.define<
          SchemaLoadPureArgs,
          LoadSchemaArgs,
          ApiSchema
        >()
          .withLogic(async (args) => {
            return await this.schemaService.loadSchema(args);
          })
          .withResultDisplay((result) => {
            SchemaCommandPrinters.loadSchema(result);
          })
          .execute(options as SchemaLoadPureArgs);
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

        if ((options as SchemaListPureArgs).json) {
          const json = result.json();
          console.log(json);
          return;
        }

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
          let selectedEndpoint: EndpointMetaData | undefined = undefined;
          let stateMachine = new SchemaListDisplayStateMachine();
          let endpointStateMachine = new EndpointListDisplayStateMachine();

          while (!stateMachine.is('CLOSE')) {
            if (stateMachine.is('LIST')) {
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

              selectedSchemaId =
                await SchemaListPrompts.selectSchemaPrompt(schemas);
              stateMachine.to('DETAILS');
            } else if (stateMachine.is('DETAILS')) {
              if (!selectedSchemaId)
                throw new Error('Selected schema ID should be defined here');
              if (!schemas) throw new Error('Schemas should be defined here');

              const selectedSchema = schemas!.find(
                (s: any) => s.id === selectedSchemaId,
              );

              if (!selectedSchema) {
                throw new Error('Selected schema should be defined here');
              }

              console.info(
                SchemaCommandStrings.schemaDetails(selectedSchema, true),
              );

              await SchemaListPrompts.selectActionAfterSchemaDetails(
                stateMachine,
              );
            } else if (stateMachine.is('ENDPOINTS')) {
              if (!selectedSchemaId) {
                throw new Error('Selected schema ID should be defined here');
              }

              const methodChoice = await SchemaListPrompts.selectHttpMethod();

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

              console.info(
                SchemaCommandStrings.endpointListPages(
                  selectedSchemaId,
                  pagedList,
                ),
              );

              endpointStateMachine = new EndpointListDisplayStateMachine();
              selectedEndpoint = await SchemaListPrompts.selectEndpoint(
                pagedList,
                endpointStateMachine,
                methodChoice === 'ALL' ? undefined : methodChoice,
              );
            } else if (endpointStateMachine.is('ACTIONS') && selectedEndpoint) {
              console.info(
                SchemaCommandStrings.endpointDetails(selectedEndpoint),
              );

              const nextAction =
                await SchemaListPrompts.selectActionAfterEndpointDetails();

              if (nextAction === 'copy_path') {
                console.info(selectedEndpoint.path);
                endpointStateMachine.to('ACTIONS');
              } else if (nextAction === 'copy_full') {
                console.info(
                  `${selectedEndpoint.method} ${selectedEndpoint.path}`,
                );
                endpointStateMachine.to('ACTIONS');
              } else if (nextAction === 'reselect') {
                endpointStateMachine.to('SELECT');
              } else if (nextAction === 'refilter') {
                endpointStateMachine.to('BACK'); // go up, re-enter ENDPOINTS
              } else if (nextAction === 'back') {
                endpointStateMachine.to('BACK');
              } else if (nextAction === 'list_templates') {
                const templatesResult =
                  await this.templateFillingService.listTemplates(
                    selectedEndpoint.schemaId,
                    selectedEndpoint.name,
                  );

                if (templatesResult.isFailure()) {
                  console.error(templatesResult.errorMessage);
                  endpointStateMachine.to('ACTIONS');
                } else {
                  const templates = templatesResult.value;
                  if (!templates || templates.length === 0) {
                    console.info(TemplateCommandStrings.TemplatesNotFound);
                  } else {
                    const selectedTemplate =
                      await SchemaListPrompts.selectTemplateAction(templates);

                    if (selectedTemplate === '__back') {
                      endpointStateMachine.to('ACTIONS');
                    } else {
                      const template = templates.find(
                        (t) => t.name === selectedTemplate,
                      );
                      if (template) {
                        console.info(
                          TemplateCommandStrings.templateDetails(template),
                        );

                        await SchemaListPrompts.selectActionAfterTemplateDetails(
                          endpointStateMachine,
                        );
                      } else {
                        console.error('Template not found');
                      }
                      endpointStateMachine.to('ACTIONS');
                    }
                  }
                }
              } else {
                endpointStateMachine.to('CLOSE');
              }
            }
          }

          if (endpointStateMachine.is('BACK')) {
            stateMachine.to('DETAILS');
          } else {
            stateMachine.to('CLOSE');
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

            const table = new SchemaTablePage(
              pageSchemas,
              options.detailed,
              currentPage,
              pageSize,
            );
            table.display();

            const choice = await SchemaListPrompts.schemaTablePagerPrompt(
              pageSchemas,
              currentPage,
              pageSize,
            );

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
              `Endpoints for schema ${
                pagedList.items[0].schemaId
              } (Page ${pagedList.page} of ${Math.ceil(
                pagedList.totalCount / pagedList.size,
              )}):`,
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
