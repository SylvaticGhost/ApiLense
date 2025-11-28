import { ApiSchema } from '../../core/apiSchema.ts';
import NamedColorProvider from '../../infrastructure/providers/namedColorProvider.ts';
import { StringBuilder } from '../../utils/stringBuilder.ts';

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
    return `${s.name} (ID: ${s.id}) ${s.group ? `[${new StringBuilder().appendHexColor(s.group.name, s.group.color || NamedColorProvider.COLORS['gray']).toString()}]` : ''}`;
  }
}
