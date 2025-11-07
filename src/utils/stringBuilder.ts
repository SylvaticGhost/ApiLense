export class StringBuilder {
  private str: string = '';

  appendLine(line: string = ''): StringBuilder {
    this.str += line + '\n';
    return this;
  }

  append(text: string): StringBuilder {
    this.str += text;
    return this;
  }

  toString(): string {
    return this.str;
  }
}
