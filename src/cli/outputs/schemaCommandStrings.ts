import { colors } from '@cliffy/ansi/colors';
import { ApiSchema } from '../../core/apiSchema.ts';
import { EndpointMetaData } from '../../core/endpoint.ts';
import NamedColorProvider from '../../infrastructure/providers/namedColorProvider.ts';
import { StringBuilder } from '../../utils/stringBuilder.ts';
import { ColorProvider } from '../../infrastructure/providers/colorProvider.ts';
import { PagedList } from '../../utils/types/pagedList.ts';

export class SchemaCommandStrings {
  static schemaDetails(schema: ApiSchema, detailed: boolean = false): string {
    const sb = new StringBuilder();
    sb.appendLine('Schema Details:');
    sb.appendLine(`ID:           ${schema.id}`);
    sb.appendLine(`Name:         ${schema.name}`);
    if (schema.group) {
      sb.appendLine(
        `Group:        ${
          schema.group
            ? new StringBuilder()
                .appendHexColor(
                  schema.group.name,
                  schema.group.color ?? NamedColorProvider.COLORS['gray'],
                )
                .toString()
            : 'N/A'
        }`,
      );
    }
    sb.appendLine(`URL:          ${schema.url || 'N/A'}`);
    if (detailed) {
      sb.appendLine(`Created At:   ${schema.createdAt}`);
      sb.appendLine(`Last Usage:   ${schema.updatedAt}`);
    }
    return sb.toString();
  }

  static schemaRowPreview(s: ApiSchema): string {
    return `${s.name} (ID: ${s.id}) ${
      s.group
        ? `[${new StringBuilder()
            .appendHexColor(
              s.group.name,
              s.group.color || NamedColorProvider.COLORS['gray'],
            )
            .toString()}]`
        : ''
    }`;
  }

  static endpointDetails(endpoint: EndpointMetaData): string {
    return new StringBuilder()
      .appendLine()
      .appendLine(colors.bold('Endpoint details:'))
      .append('- Name: ')
      .appendLine(endpoint.name)
      .append('- Method: ')
      .appendColor(
        endpoint.method,
        ColorProvider.getHttpMethodColor(endpoint.method),
      )
      .appendLine()
      .append('- Path: ')
      .appendLine(endpoint.path)
      .toString();
  }

  static endpointListPages(
    schemaId: number,
    pagedList: PagedList<EndpointMetaData>,
  ): string {
    return new StringBuilder()
      .appendLine(
        `Endpoints for schema ${schemaId} (Page ${pagedList.page} of ${Math.ceil(
          pagedList.totalCount / pagedList.size,
        )}):`,
      )
      .toString();
  }
}
