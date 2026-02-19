import { Table } from '@cliffy/table';

export class SchemaTablePage {
  private static readonly HEADERS = ['ID', 'Name', 'Group', 'URL'];
  private static readonly ADDITIONAL_HEADERS = ['Created At', 'Last Usage'];

  constructor(
    private readonly pageSchemas: any[],
    private readonly detailed: boolean = false,
    private readonly currentPage: number = 1,
    private readonly pageSize: number = 10,
  ) {}

  display(): void {
    const headers = this.detailed
      ? SchemaTablePage.HEADERS.concat(SchemaTablePage.ADDITIONAL_HEADERS)
      : SchemaTablePage.HEADERS;

    const table = new Table().header(headers);

    this.pageSchemas.forEach((s: any) => {
      const url = s.url || '-';
      const shortUrl = url.length > 80 ? url.slice(0, 77) + '...' : url;
      const row = [s.id.toString(), s.name, s.Group?.name || '-', shortUrl];

      if (this.detailed) {
        row.push(
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-',
        );
        row.push(
          s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '-',
        );
      }

      table.push(row);
    });

    console.info(
      `\nPage ${this.currentPage} — showing ${this.pageSchemas.length} item(s) (size ${this.pageSize})`,
    );
    table.render();
  }
}
