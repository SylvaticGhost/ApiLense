import { Table } from '@cliffy/table';
import NamedColorProvider from '../../infrastructure/providers/namedColorProvider.ts';

export class GroupTablePage {
  private static readonly HEADERS = ['ID', 'Name', 'Description'];

  constructor(
    private readonly groups: {
      id: number;
      name: string;
      description?: string;
    }[],
    private readonly currentPage: number = 1,
  ) {}

  display(): void {
    const table = new Table().header(GroupTablePage.HEADERS);
    this.groups.forEach((g: any) => {
      const colorVal = g.color || '';
      let coloredLabel = '-';
      if (colorVal) {
        const normalized =
          NamedColorProvider.normalizeHex(colorVal) ||
          colorVal.replace('#', '').toUpperCase();
        const name = NamedColorProvider.findNameForHex(normalized);
        const label = name
          ? name.charAt(0).toUpperCase() + name.slice(1)
          : '#' + normalized;
        // Colorize text itself (foreground color)
        coloredLabel = NamedColorProvider.colorizeTextByHex(normalized, label);
      }
      table.push([g.id.toString(), g.name, coloredLabel]);
    });

    console.log(
      `\nPage ${this.currentPage} — showing ${this.groups.length} group(s)`,
    );
    table.render();
  }
}
