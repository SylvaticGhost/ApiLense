import { Table } from '@cliffy/table';

export class SmallSchemaTablePage {
  private static readonly HEADERS = ['ID', 'Name', 'Group'];

  constructor(private readonly pageSchemas: any[]) {}

  display(): void {
    const table = new Table().header(SmallSchemaTablePage.HEADERS);
    this.pageSchemas.forEach((s: any) => {
      const shortUrl = s.url
        ? s.url.length > 80
          ? s.url.slice(0, 77) + '...'
          : s.url
        : '-';
      table.push([s.id.toString(), s.name, shortUrl]);
    });
    table.render();
  }
}
