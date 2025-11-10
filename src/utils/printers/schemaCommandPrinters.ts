import { Result } from '../result.ts';
import { SchemaListItemDto } from '../../contracts/schemaCommandsArgs.ts';
import { Select } from '@cliffy/prompt/select';
import { Table } from '@cliffy/table';
import { colors } from '@cliffy/ansi/colors';

export class SchemaCommandPrinters {
  public static loadSchema(result: Result): void {
    if (result.isFailure()) {
      console.error(colors.red(result.error || 'Failed to load schema'));
    } else {
      console.log(
        colors.green(`Schema loaded successfully with ID: ${result.value}`),
      );
    }
  }

  public static displayListMode(
    result: Result<SchemaListItemDto[]>,
    options: { detailed: boolean },
  ): void {
    if (result.isFailure()) {
      console.error(colors.red(result.error || 'Failed to list schemas'));
      return;
    }

    const schemas = result.value;
    if (!schemas || schemas.length === 0) {
      console.log(colors.yellow('No schemas found.'));
      return;
    }

    const headers = [
      'ID',
      'Name',
      'Group',
      'Source (URL/File)',
    ];
    if (options.detailed) {
      headers.push('Created', 'Last Used (Modified)');
    }

    const body = schemas.map((s) => {
      const row = [
        s.id.toString(),
        s.name,
        s.groupName || '-',
        s.source,
      ];
      if (options.detailed) {
        row.push(
          s.createdAt.toLocaleDateString(),
          s.modifiedAt.toLocaleString(),
        );
      }
      return row;
    });

    new Table()
      .header(headers.map((h) => colors.cyan.bold(h)))
      .body(body)
      .border(true)
      .render();
  }

  public static async displayInteractiveMode(
    result: Result<SchemaListItemDto[]>,
  ): Promise<void> {
    if (result.isFailure()) {
      console.error(colors.red(result.error || 'Failed to list schemas'));
      return;
    }

    const schemas = result.value;
    if (!schemas || schemas.length === 0) {
      console.log(colors.yellow('No schemas found.'));
      return;
    }

    const promptOptions = schemas.map((s) => ({
      name: `${s.name.padEnd(30)} ${colors.dim(`(Group: ${s.groupName || '-'})`)}`,
      value: s.id.toString(),
    }));

    promptOptions.push({ name: colors.gray('Cancel'), value: '__cancel__' });

    const selectedIdStr = await Select.prompt({
      message: 'Select a schema to view details (use arrows)',
      options: promptOptions,
      search: true,
    });

    if (selectedIdStr === '__cancel__' || !selectedIdStr) {
      return;
    }

    const selectedSchema = schemas.find(
      (s) => s.id.toString() === selectedIdStr,
    );

    if (selectedSchema) {
      console.log(colors.green.bold(`\nSchema Details: ${selectedSchema.name}`));

      new Table()
        .header(['Property', 'Value'].map((h) => colors.cyan(h)))
        .body([
          ['ID', selectedSchema.id.toString()],
          ['Name', selectedSchema.name],
          ['Group', selectedSchema.groupName || '-'],
          ['Source', selectedSchema.source],
          ['Created At', selectedSchema.createdAt.toLocaleString()],
          ['Last Used (Modified)', selectedSchema.modifiedAt.toLocaleString()],
        ])
        .border(true)
        .render();
    }
  }
}