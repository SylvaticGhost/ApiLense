import { colors } from '@cliffy/ansi/colors';
import { TemplateFilling } from '../../core/templateFilling.ts';
import { StringBuilder } from '../../utils/stringBuilder.ts';
import { FileUrl } from '../../utils/types/fileUrl.ts';

export class TemplateCommandStrings {
  static templateDetails(template: TemplateFilling): string {
    return new StringBuilder()
      .appendLine()
      .appendLine(colors.bold('Template details:'))
      .append('- Name: ')
      .appendLine(template.name)
      .append('- Endpoint: ')
      .appendLine(template.endpointName)
      .append('- Schema ID: ')
      .appendLine(template.schemaId.toString())
      .appendLine('- File Path: ')
      .append(new FileUrl(template.filePath(), 'Click to open').toString())
      .appendLine()
      .toString();
  }

  static TemplatesNotFound: string = new StringBuilder()
    .appendLine()
    .appendLine(colors.bold.yellow('No templates found for this endpoint ⚠️'))
    .appendLine()
    .toString();
}
