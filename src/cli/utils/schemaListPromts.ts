import { Select } from '@cliffy/prompt/select';
import { ApiSchema } from '../../core/apiSchema.ts';
import { SchemaCommandStrings } from '../outputs/schemaCommandStrings.ts';
import {
  EndpointListDisplayStateMachine,
  SchemaListDisplayStateMachine,
} from './schemaCommandsStates.ts';
import { HTTP_METHODS } from '../../core/enums.ts';
import { StringBuilder } from '../../utils/stringBuilder.ts';
import { ColorProvider } from '../../infrastructure/providers/colorProvider.ts';
import { PagedList } from '../../utils/types/pagedList.ts';
import { EndpointMetaData } from '../../core/endpoint.ts';
import { TemplateFilling } from '../../core/templateFilling.ts';

export class SchemaListPrompts {
  static async selectSchemaPrompt(schemas: ApiSchema[]): Promise<number> {
    this.clearConsole();
    const idStr = await Select.prompt({
      message: 'Select a schema to view details',
      options: schemas.map((s: any) => ({
        name: SchemaCommandStrings.schemaRowPreview(s),
        value: s.id.toString(),
      })),
    });
    return Number(idStr);
  }

  static async selectActionAfterSchemaDetails(
    stateMachine: SchemaListDisplayStateMachine,
  ): Promise<'LIST' | 'ENDPOINTS' | 'CLOSE'> {
    this.clearConsole();
    const action = await Select.prompt({
      message: 'Next action',
      options: [
        { name: 'Return to list', value: 'return' },
        { name: 'List endpoints', value: 'endpoints' },
        { name: 'Close', value: 'close' },
      ],
    });

    if (action === 'return') {
      stateMachine.to('LIST');
    } else if (action === 'endpoints') {
      stateMachine.to('ENDPOINTS');
    } else {
      stateMachine.to('CLOSE');
    }
    return action as 'LIST' | 'ENDPOINTS' | 'CLOSE';
  }

  private static httpMethodOptions = [
    { name: 'All methods', value: 'ALL' },
    ...(Object.keys(HTTP_METHODS) as Array<keyof typeof HTTP_METHODS>).map(
      (m) => ({
        name: new StringBuilder()
          .appendColor(m, ColorProvider.getHttpMethodColor(m))
          .toString(),
        value: m,
      }),
    ),
  ] as Array<{ name: string; value: string }>;

  static async selectHttpMethod(): Promise<string> {
    Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
    return await Select.prompt({
      message: 'Filter endpoints by HTTP method',
      options: this.httpMethodOptions,
    });
  }

  static async selectEndpoint(
    pagedList: PagedList<EndpointMetaData>,
    stateMachine: EndpointListDisplayStateMachine,
    methodChoice?: string,
  ): Promise<EndpointMetaData | undefined> {
    this.clearConsole();
    const methodFilter =
      methodChoice === 'ALL'
        ? undefined
        : (methodChoice as keyof typeof HTTP_METHODS);
    const selectedEndpointId = await Select.prompt({
      message: `Select endpoint (${methodFilter ?? 'ALL'})`,
      options: pagedList.items.map((e) => ({
        name: new StringBuilder()
          .append('[')
          .appendColor(e.method, ColorProvider.getHttpMethodColor(e.method))
          .append('] ')
          .append(e.path)
          .toString(),
        value: e.name,
      })),
    });

    const selectedEndpoint = pagedList.items.find(
      (e) => e.name === selectedEndpointId,
    );

    if (!selectedEndpoint) {
      console.error('Endpoint not found');
      stateMachine.to('SELECT');
      return undefined;
    } else {
      stateMachine.to('ACTIONS');
    }
    return selectedEndpoint;
  }

  static selectActionAfterEndpointDetails(): Promise<string> {
    return Select.prompt({
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
  }

  static async selectTemplateAction(
    templates: TemplateFilling[],
  ): Promise<string> {
    const selectionOptions = templates.map((t) => ({
      name: t.name,
      value: t.name,
    }));

    selectionOptions.push({
      name: 'Back',
      value: '__back',
    });

    this.clearConsole();

    return await Select.prompt({
      message: 'Select a template to view details',
      options: templates.map((t) => ({
        name: t.name,
        value: t.name,
      })),
    });
  }

  static async selectActionAfterTemplateDetails(
    endpointStateMachine: EndpointListDisplayStateMachine,
  ): Promise<string> {
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

    if (actionOnTemplate === 'back') {
      endpointStateMachine.to('ACTIONS');
    } else if (actionOnTemplate === 'close') {
      endpointStateMachine.to('CLOSE');
    }

    return endpointStateMachine.current;
  }

  static async schemaTablePagerPrompt(
    pageSchemas: any[],
    currentPage: number,
    pageSize: number,
  ): Promise<'prev' | 'next' | 'exit'> {
    const canPrev = currentPage > 1;
    const canNext = pageSchemas.length === pageSize;

    const navOptions: Array<{ name: string; value: string }> = [];
    if (canPrev) {
      navOptions.push({ name: '⟵ Prev page', value: 'prev' });
    }
    if (canNext) {
      navOptions.push({ name: 'Next page ⟶', value: 'next' });
    }
    navOptions.push({ name: 'Exit', value: 'exit' });

    const selection = await Select.prompt({
      message: 'Navigate pages',
      options: navOptions,
    });
    return selection as 'prev' | 'next' | 'exit';
  }

  private static clearConsole() {
    Deno.stdout.writeSync(new TextEncoder().encode('\x1b[2J\x1b[H'));
  }
}
