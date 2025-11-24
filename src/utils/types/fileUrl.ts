import { resolve } from 'https://deno.land/std/path/mod.ts';

function createLink(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

export class FileUrl {
  private readonly openLink: string;

  constructor(path: string, label: string) {
    const absolutePath = resolve(path);
    const fileUrl = `file://${absolutePath}`;
    this.openLink = createLink(label, fileUrl);
  }

  toString(): string {
    return this.openLink;
  }
}
