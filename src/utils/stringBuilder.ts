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

  appendStringifiedObject(obj: any): StringBuilder {
    const objStr = JSON.stringify(JSON.parse(obj), null, 2);
    this.str += objStr;
    return this;
  }

  appendBuilderIf(
    condition: boolean | undefined,
    builderFunc: (stringBuilder: StringBuilder) => void,
  ): StringBuilder {
    if (condition) {
      const builder = new StringBuilder();
      builderFunc(builder);
      this.str += builder.toString();
    }
    return this;
  }

  toString(): string {
    return this.str;
  }
}
