import { Select } from '@cliffy/prompt/select';

export class GroupListPrompts {
  static groupTablePager(
    groups: { id: number; name: string; color?: string }[],
    currentPage: number,
  ): Promise<string> {
    return Select.prompt({
      message: 'Open group or navigate',
      options: [
        ...groups.map((g: any) => ({
          name: `${g.name} (ID:${g.id})`,
          value: `open:${g.id}`,
        })),
        { name: 'Next page', value: 'next' },
        { name: 'Prev page', value: 'prev' },
        { name: 'Exit', value: 'exit' },
      ],
    });
  }
}
